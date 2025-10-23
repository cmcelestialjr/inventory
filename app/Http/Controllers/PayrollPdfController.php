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
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    $pdf->SetCreator(PDF_CREATOR);
    $pdf->SetAuthor('CDEV IT Solutions');
    $pdf->SetTitle('Employee Payroll Summary');
    $pdf->SetSubject('Payroll');
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->SetMargins($this->margin_x, 5, $this->margin_x);
    $pdf->SetAutoPageBreak(TRUE, 5); // Auto-break with a bottom margin of 5

    $page_width = $pdf->getPageWidth();
    $this->column_width = ($page_width - ($this->margin_x * 2) - $this->column_gap) / 2;

    // Add first page
    $pdf->AddPage();
    $pdf->SetFont('dejavusans', '', 10);
    $pdf->Ln(2);

    $employee_count = 0;
    $previous_employee_height = 0;
    $bottom_margin = 5;
    $estimated_entry_height = 10;
    $count_4_employee = 0;
    $date_to_bank = $payroll['date_to_bank'] ? date('M d, Y', strtotime($payroll['date_to_bank'])) : '';

    foreach ($payroll['employees'] as $employee) {
        
        $is_new_column = ($employee_count % 2) === 1;

        $page_height = $pdf->getPageHeight();
        $half_page_height = ($page_height - $this->margin_x * 2) / 2;
        
        if ($is_new_column) {
            // Move to the second column
            $x = $this->margin_x + $this->column_width + $this->column_gap;
            $y = $pdf->GetY() - $previous_employee_height;
        } else {            
            // First column entry
            if ($count_4_employee>3) {
                $count_4_employee = 0;
                $pdf->AddPage();
                $pdf->SetY(5);
            }

            $x = $this->margin_x;
            $y = $pdf->GetY();
        }

        // Start tracking the height of this employee block
        $start_y = $pdf->GetY();
        $pdf->SetXY($x, $y);

        // --- Place Logo, Company Name, and Address ---

        // Logo setup
        $logo_path = public_path('images/rockfil.png');
        $logo_x = $x;  // Left margin for logo
        $logo_y = $y;  // Align logo to the Y position of the employee block
        $logo_width = 15;  // Width of the logo in mm
        $logo_height = 18; // Height of the logo in mm
        $pdf->Image($logo_path, $logo_x, $logo_y, $logo_width, $logo_height);

        // Company name and address setup
        $company_name = "ROCKFIL STAINLESS METAL WORK DOT SUPPLY CORP.";
        $address = "Delgado Bldg. Brgy 110 Utap, Diversion Rd. Tacloban City";
        $text_x = $logo_x + $logo_width + 5;

        // Adjust Y for vertical centering relative to the logo
        $logo_bottom_y = $logo_y + $logo_height;

        $pdf->SetFont('dejavusans', 'B', 10);
        $pdf->SetXY($x + 15, $y+6);
        $pdf->Cell($this->column_width -16, '', $company_name, 0, 1, 'L', 0, '', 1);
        $pdf->SetXY($x + 15, $y + 12);
        $pdf->SetFont('dejavusans', '', 8);
        $pdf->Cell($this->column_width -16, '', $address, 0, 1, 'C', 0, '', 1);

        // Employee information
        $middlename = isset($employee['middlename']) ? ' ' . $employee['middlename'][0] . '.' : '';
        $extname = isset($employee['extname']) ? ' ' . $employee['extname'] : '';
        $name = $employee['lastname'] . ', ' . $employee['firstname'] . $extname . $middlename;

        $y = $logo_bottom_y + 4;

        $pdf->SetXY($x, $y);
        $pdf->SetFont('dejavusans', '', 9);
        $pdf->Cell($this->column_width, 5, 'PAY SLIP FOR PERIOD OF '.strtoupper($payroll['period']), 0, 1, 'C', 0, '', 1);

        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', '', 9);
        $pdf->Cell($this->column_width, 5, 'Pay Date: '.$date_to_bank, 0, 1, 'C', 0, '', 1);
        
        $pdf->SetY($pdf->GetY() + 5);
        // Employee Name
        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(33, 5, 'Employee Name:', 0, 1, 'L');

        $pdf->SetXY($x + 33, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', '', 10);
        $pdf->Cell($this->column_width - 33, 5, $name, 0, 1, 'L', 0, '', 1);

        // Employee Position
        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(33, 5, 'Position:', 0, 1, 'L');

        $pdf->SetXY($x + 33, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell($this->column_width - 33, 5, $employee['position'], 0, 1, 'L', 0, '', 1);

        // Employee No
        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(33, 5, 'Employee No:', 0, 1, 'L');

        $pdf->SetXY($x + 33, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell($this->column_width - 33, 5, $employee['employee']['employee_no'], 0, 1, 'L', 0, '', 1);

        // Day.Hour.Min of Work
        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'I', 8);
        $pdf->Cell(33, 5, 'Day.Hour.Minute of Work', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 33, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(15, 5, $employee['day'].'.'.$employee['hour'].'.'.$employee['minute'], 0, 1, 'C', 0, '', 1);

        $pdf->SetXY($x + 33 + 15, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(25, 5, 'OT Hour.Minute:', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 33 + 15 + 25, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell($this->column_width - 33 - 15 - 25, 5, $employee['ot_hour'].'.'.$employee['ot_minute'], 0, 1, 'C', 0, '', 1);
        
        $pdf->SetY($pdf->GetY() + 5);

        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'B', 9);
        $pdf->Cell(27, 5, 'EARNINGS', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 27, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'B', 9);
        $pdf->Cell(18, 5, 'Amount', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 27 + 18, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'B', 9);
        $pdf->Cell(27, 5, 'DEDUCTIONS', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 27 + 18 + 27, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'B', 9);
        $pdf->Cell(18, 5, 'Amount', 0, 1, 'L', 0, '', 1);

        $start_y_summary = $pdf->GetY();
        
        if(isset($employee['other_earned']) && count($employee['other_earned']) > 0){
            $additional_y = 0;
            foreach($employee['other_earned'] as $otherEarned){
                $pdf->SetXY($x, $start_y_summary + $additional_y);
                $pdf->SetFont('dejavusans', 'I', 9);
                $pdf->Cell(27, 4, $otherEarned['earning_type']['name'], 0, 1, 'L', 0, '', 1);

                $pdf->SetXY($x + 27, $start_y_summary + $additional_y);
                $pdf->SetFont('dejavusans', 'I', 9);
                $pdf->Cell(18, 5, '₱'.number_format($otherEarned['total'],2), 0, 1, 'R', 0, '', 1);
                $additional_y += 4;
            }
        }

        $pdf->SetXY($x + 27 + 18, $start_y_summary);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(27, 4, 'Lates:', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 27 + 18 + 27, $start_y_summary);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(18, 4, $employee['lates_absences'] > 0 ? '₱'.number_format($employee['lates_absences'],2) : '', 0, 1, 'R', 0, '', 1);

        if(isset($employee['deduction_list']) && count($employee['deduction_list']) > 0){
            $additional_y = 4;
            foreach($employee['deduction_list'] as $deduction){
                $deduction_group = $deduction['deduction']['group'] ? "({$deduction['deduction']['group']})" : "";
                $deduction_label = "{$deduction['deduction']['name']}{$deduction_group}:";
                $pdf->SetXY($x + 27 + 18, $start_y_summary + $additional_y);
                $pdf->SetFont('dejavusans', 'I', 9);
                $pdf->Cell(27, 4, $deduction_label, 0, 1, 'L', 0, '', 1);

                $pdf->SetXY($x + 27 + 18 + 27, $start_y_summary + $additional_y);
                $pdf->SetFont('dejavusans', 'I', 9);
                $pdf->Cell(18, 4, '₱'.number_format($deduction['amount'],2), 0, 1, 'R', 0, '', 1);

                $additional_y += 4;
            }
        }

        $pdf->SetY(122);

        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(27, 5, 'Gross Earnings:', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 27, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(18, 5, '₱'.number_format($employee['gross']), 0, 1, 'R', 0, '', 1);

        $pdf->SetXY($x + 27 + 18, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(27, 5, 'Total Deductions:', 0, 1, 'L', 0, '', 1);

        $pdf->SetXY($x + 27 + 18 + 27, $pdf->GetY() - 4);
        $pdf->SetFont('dejavusans', 'I', 9);
        $pdf->Cell(18, 5, '₱'.number_format($employee['deduction']), 0, 1, 'R', 0, '', 1);

        $pdf->SetY($pdf->GetY() + 4);

        $pdf->SetX($x);
        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->Cell(27 + 18, 5, 'NET SALARY PAYABLE:', 0, 1, 'C', 0, '', 1);

        $pdf->SetXY($x + 27 + 18, $pdf->GetY() - 5);
        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->Cell(18 + 27, 5, '₱'.number_format($employee['netpay']), 0, 1, 'C', 0, '', 1);

        $pdf->SetY($pdf->GetY() + 4);

        $pdf->SetXY($x, $pdf->GetY());
        $pdf->SetFont('dejavusans', 'I', 7);
        $pdf->Cell($this->column_width, 5, 'This payslip is system generated. Signature is not required.', 0, 1, 'C', 0, '', 1);

        // $pdf->SetXY($x, $start_y_summary);
        // $pdf->SetFont('dejavusans', 'B', 8);
        // $pdf->Cell(27, 4, 'EARNINGS', 0, 1, 'L', 0, '', 1);

        // $pdf->SetXY($x + 27, $start_y_summary);
        // $pdf->SetFont('dejavusans', 'B', 8);
        // $pdf->Cell(18, 4, 'Amount', 1, 1, 'L', 0, '', 1);

        // $pdf->SetXY($x + 27 + 18, $start_y_summary);
        // $pdf->SetFont('dejavusans', 'B', 8);
        // $pdf->Cell(27, 4, 'DEDUCTIONS', 0, 1, 'L', 0, '', 1);

        // $pdf->SetXY($x + 27 + 18 + 27, $start_y_summary);
        // $pdf->SetFont('dejavusans', 'B', 8);
        // $pdf->Cell(18, 4, 'Amount', 0, 1, 'L', 0, '', 1);

        // // Earnings and Attendance
        // $pdf->SetFont('dejavusans', '', 10);
        // $this->addDetailRow($pdf, $x, 'Period:', "{$payroll['period']}");
        // $this->addDetailRow($pdf, $x, 'Type:', "{$payroll['payroll_type']['name']}");
        // $this->addDetailRow($pdf, $x, 'Base Salary:', "{$employee['salary']}");
        // $this->addDetailRow($pdf, $x, 'Days Present:', "{$employee['no_of_day_present']}");

        // $pdf->Ln(1);
        // $pdf->SetFont('dejavusans', 'B', 10);
        // $this->addDetailRow($pdf, $x, 'Earned:', "{$employee['earned']}", true, 11);
        // $pdf->SetFont('dejavusans', '', 10);

        // // Deductions
        // $pdf->SetFont('dejavusans', 'B', 10);
        // $this->addDetailRow($pdf, $x, "Deductions:", "");
        // $pdf->SetFont('dejavusans', '', 9);

        // if (isset($employee['deduction_list']) && count($employee['deduction_list']) > 0) {
        //     foreach ($employee['deduction_list'] as $deduction) {
        //         $deduction_group = $deduction['deduction']['group'] ? "({$deduction['deduction']['group']})" : "";
        //         $deduction_label = "{$deduction['deduction']['name']}{$deduction_group}:";
        //         $this->addDetailRow($pdf, $x, $deduction_label, $deduction['amount']);
        //     }
        // } else {
        //     $pdf->SetX($x);
        //     $pdf->Cell($this->column_width, 5, '-', 0, 1, 'L');
        // }

        // // Totals and Net Pay
        // $pdf->Ln(1);
        // $pdf->SetFont('dejavusans', 'B', 10);
        // $this->addDetailRow($pdf, $x, 'Total Deductions:', "{$employee['deduction']}");

        // $pdf->SetDrawColor(0, 0, 0);
        // $pdf->SetLineWidth(0.3);
        // $pdf->SetFillColor(220, 240, 255);

        // $pdf->Ln(1);
        // $pdf->SetFont('dejavusans', 'B', 12);
        // $pdf->SetX($x);
        // $pdf->Cell($this->column_width * 0.55, 7, 'NET PAY:', 'T', 0, 'L', 1);
        // $pdf->Cell($this->column_width * 0.45, 7, "{$employee['netpay']}", 'T', 1, 'R', 1);

        // $pdf->Ln(5); // Space after the entry

        // Calculate the height of the current block for column alignment
        $end_y = $pdf->GetY();
        $previous_employee_height = $end_y - $start_y;

        $employee_count++;

        if ($employee_count % 2 === 0) {
            // Move the Y position down to the bottom of the two columns for the next entry
            $pdf->SetY(150);
        }
        $count_4_employee++;
    }
    

    // --- Output ---
    $pdfContent = $pdf->Output('', 'S');
    $base64PDF = base64_encode($pdfContent);
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