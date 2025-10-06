<?php 

namespace App\Http\Controllers;

use TCPDF;
use Illuminate\Http\Request;


class PayrollPdfController extends Controller
{
    // Define column settings
    private $column_width;
    private $margin_x = 10;
    private $column_gap = 10;

    public function index(Request $request)
    {
        $payroll = $request->input('payroll');  // Payroll data from the React front-end

        // --- PDF Initialization and Setup ---

        // Create new TCPDF instance
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Set document information (Professional touch)
        $pdf->SetCreator(PDF_CREATOR);
        $pdf->SetAuthor('Your Company Name');
        $pdf->SetTitle('Employee Payroll Summary');
        $pdf->SetSubject('Payroll');
        
        // Remove default header/footer
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        
        // Set margins (adjusting for column use)
        $pdf->SetMargins($this->margin_x, 15, $this->margin_x);
        $pdf->SetAutoPageBreak(TRUE, 15); // Auto-break with a bottom margin of 15

        // Calculate column width
        $page_width = $pdf->getPageWidth();
        $this->column_width = ($page_width - ($this->margin_x * 2) - $this->column_gap) / 2;

        // Add first page
        $pdf->AddPage();

        $pdf->SetFont('helvetica', '', 10);
        $pdf->Ln(2);
        
        // --- Two-Column Content Generation ---
        
        $employee_count = 0;
        $previous_employee_height = 0; // Initialize height tracking
        $bottom_margin = 15; // Matches SetAutoPageBreak margin
        $estimated_entry_height = 10; // Estimate space needed for a minimum entry

        foreach ($payroll['employees'] as $employee) {
            
            $is_new_column = ($employee_count % 2) === 1; // True for the second column (odd count)
            
            if ($is_new_column) {
                // Move to the second column
                $x = $this->margin_x + $this->column_width + $this->column_gap;
                // Go back up to align with the previous entry's start Y position
                $y = $pdf->GetY() - $previous_employee_height; 
            } else {
                // First column entry
                
                // VITAL FIX: Manual page break check using a public method
                // If we are too close to the bottom for a new entry, force a new page.
                if ($pdf->GetY() > ($pdf->getPageHeight() - $bottom_margin - $estimated_entry_height)) {
                    $pdf->AddPage();
                    // Reset Y position to the top margin after adding the page
                    $pdf->SetY(15); 
                }

                $x = $this->margin_x;
                $y = $pdf->GetY();
            }
            
            // Start tracking the height of this employee block
            $start_y = $pdf->GetY();
            
            // Set current position for the employee block
            $pdf->SetXY($x, $y);
            
            // 1. Employee Name and Position (Styled Header)
            $middlename = isset($employee['middlename']) ? ' ' . $employee['middlename'][0] . '.' : '';
            $extname = isset($employee['extname']) ? ' ' . $employee['extname'] : '';
            $name = $employee['lastname'] . ', ' . $employee['firstname'] . $extname . $middlename;

            // Name (Bold and larger)
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell($this->column_width, 6, $name, 0, 1, 'L');
            
            // Position (Italic)
            $pdf->SetX($x); // Reset X after the Cell call above
            $pdf->SetFont('helvetica', 'I', 10);
            $pdf->Cell($this->column_width, 5, "{$employee['position']}", 'B', 1, 'L'); // Add a separator line
            
            $pdf->Ln(2); // Small space

            // 2. Earnings and Attendance (Data in a clean table-like format)
            $pdf->SetFont('helvetica', '', 10);

            $this->addDetailRow($pdf, $x, 'Period:', "{$payroll['period']}");
            $this->addDetailRow($pdf, $x, 'Type:', "{$payroll['payroll_type']['name']}");
            
            $this->addDetailRow($pdf, $x, 'Base Salary:', "{$employee['salary']}");
            $this->addDetailRow($pdf, $x, 'Days Present:', "{$employee['no_of_day_present']}");
            
            $pdf->Ln(1);
            
            $pdf->SetFont('helvetica', 'B', 10);
            $this->addDetailRow($pdf, $x, 'Earned:', "{$employee['earned']}", true, 11);
            $pdf->SetFont('helvetica', '', 10);
                        
            // 3. Deductions List
            $pdf->SetFont('helvetica', 'B', 10);
            $this->addDetailRow($pdf, $x, "Deductions:", "");
            $pdf->SetFont('helvetica', '', 9);
            
            if (isset($employee['deduction_list']) && count($employee['deduction_list']) > 0) {
                foreach ($employee['deduction_list'] as $deduction) {
                    $deduction_group = $deduction['deduction']['group'] ? "({$deduction['deduction']['group']})" : "";
                    $deduction_label = "{$deduction['deduction']['name']}{$deduction_group}:";
                    $this->addDetailRow($pdf, $x, $deduction_label, $deduction['amount']);
                }
            } else {
                $pdf->SetX($x);
                $pdf->Cell($this->column_width, 5, '-', 0, 1, 'L');
            }

            // 4. Totals and Net Pay (Highlighted)
            $pdf->Ln(1);

            $pdf->SetFont('helvetica', 'B', 10);
            $this->addDetailRow($pdf, $x, 'Total Deductions:', "{$employee['deduction']}");
            
            $pdf->SetDrawColor(0, 0, 0); // Black line
            $pdf->SetLineWidth(0.3); // Thicker line for emphasis
            $pdf->SetFillColor(220, 240, 255); // Light blue background for Net Pay
            
            $pdf->Ln(1);
            
            $pdf->SetFont('helvetica', 'B', 12);
            // Net Pay cell with border and background fill
            $pdf->SetX($x);
            $pdf->Cell($this->column_width * 0.55, 7, 'NET PAY:', 'T', 0, 'L', 1);
            $pdf->Cell($this->column_width * 0.45, 7, "{$employee['netpay']}", 'T', 1, 'R', 1);
            
            $pdf->Ln(5); // Space after the entry
            
            // Calculate the height of the current block for column alignment
            $end_y = $pdf->GetY();
            $previous_employee_height = $end_y - $start_y;
            
            $employee_count++;

            // If an entry completes the first column, manually move the Y position
            if ($employee_count % 2 === 0) {
                 // Move the Y position down to the bottom of the two columns for the next entry
                 // This ensures the next entry starts below the taller of the two current columns
                $pdf->SetY(max($y + $previous_employee_height + 5, $pdf->GetY()));
            }
        }

        // --- Output ---
        
        // Output PDF as a string, encode it to base64
        $pdfContent = $pdf->Output('', 'S');  // Generate PDF as string
        $base64PDF = base64_encode($pdfContent);  // Encode to base64
        
        // Return the base64-encoded PDF
        return response()->json(['pdf' => $base64PDF]);
    }
    
    /**
     * Helper function to add a detail row with label and value aligned.
     */
    private function addDetailRow(TCPDF $pdf, $x, $label, $value, $bold_value = false, $value_font_size = 10)
    {
        $label_width = $this->column_width * 0.65;
        $value_width = $this->column_width * 0.35;
        $line_height = 3;

        $pdf->SetX($x);
        $pdf->Cell($label_width, $line_height, $label, 0, 0, 'L');
        
        // Optionally make the value bold
        if ($bold_value) {
            $current_font = $pdf->getFontFamily();
            $pdf->SetFont($current_font, 'B', $value_font_size);
        }
        
        $pdf->Cell($value_width, $line_height, $value, 0, 1, 'R');
        
        // Reset font back to non-bold
        if ($bold_value) {
            $current_font = $pdf->getFontFamily();
            $pdf->SetFont($current_font, '', $value_font_size);
        }
    }
}