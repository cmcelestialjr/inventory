<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\ProductsPrice;
use App\Models\Supplier;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ProductImport implements ToModel, WithHeadingRow
{
    protected $filePath;
    protected $imageMap = [];
    protected $currentRow = 2;

    public function __construct($filePath)
    {
        $this->filePath = $filePath; 
        $this->extractImages();
    }

    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function headingRow(): int
    {
        return 1;
    }

    private function extractImages()
    {
        $spreadsheet = IOFactory::load($this->filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $drawings = $worksheet->getDrawingCollection();

        foreach ($drawings as $drawing) {
            if (!$drawing->getCoordinates()) {
                continue;
            }

            preg_match('/([A-Z]+)(\d+)/', $drawing->getCoordinates(), $matches);
            if (!isset($matches[2])) {
                continue;
            }
            $rowNumber = (int) $matches[2];

            if ($matches[1] === 'B') {
                    $imageContents = file_get_contents($drawing->getPath());
                    $imageName = time() . '_' . pathinfo($drawing->getName(), PATHINFO_FILENAME) . '.jpg';

                    Storage::disk('public')->put("product_images/$imageName", $imageContents);
                    
                    $this->imageMap[$rowNumber] = "product_images/$imageName";
                    
            }
        }

        $mergedCells = $worksheet->getMergeCells();

        $mergedRanges = [];

        foreach ($mergedCells as $mergedCell) {
            preg_match('/([A-Z]+)(\d+):([A-Z]+)(\d+)/', $mergedCell, $matches);
            if (isset($matches[2]) && isset($matches[4])) {
                $startRow = (int) $matches[2];
                $endRow = (int) $matches[4];

                for ($row = $startRow; $row <= $endRow; $row++) {
                    $mergedRanges[$row] = $startRow; 
                }
            }
        }

        $rowsWithImages = [];

        foreach ($drawings as $drawing) {
            if (!$drawing->getCoordinates()) {
                continue;
            }

            preg_match('/([A-Z]+)(\d+)/', $drawing->getCoordinates(), $matches);
            if (!isset($matches[2])) {
                continue;
            }
            $rowNumber = (int) $matches[2];

            if ($matches[1] === 'C') {
                    $imageContents = file_get_contents($drawing->getPath());
                    $imageName = time() . '_' . pathinfo($drawing->getName(), PATHINFO_FILENAME) . '.jpg';

                    Storage::disk('public')->put("product_images/$imageName", $imageContents);

                    $firstRow = $mergedRanges[$rowNumber] ?? $rowNumber;
                    
                    foreach ($mergedRanges as $row => $startRow) {
                        if ($startRow === $firstRow) {
                            $this->imageMap[$row] = "product_images/$imageName";
                        }
                    }

                    $rowsWithImages[] = $firstRow;
            }
        }
    }
    
    public function model(array $row)
    {
        $imagePath = $this->imageMap[$this->currentRow] ?? null;
        $code = $row['code'];
        $supplier = $row['supplier'];
        $name = $row['name'] ?? "";
        $variant = $row['variant'] ?? "";
        $name_variant = $row['name']."-".$row['variant'];
        $cost = $this->formatPrice($row['cost']);
        $price = $this->formatPrice($row['price']);
        $qty = $row['qty'] ?? 0;
        $category = $row['category'];

        if($supplier=='' || $supplier==null){
            $supplierId = null;
        }else{
            $checkSupplier = Supplier::where('name',$supplier)->first();
            if($checkSupplier){
                $supplierId = $checkSupplier->id;
            }else{
                $insert = new Supplier;
                $insert->name = $supplier;
                $insert->contact_person = '';
                $insert->supplier_status = 'Active';
                $insert->updated_by = 1;
                $insert->created_by = 1;
                $insert->save();
                $supplierId = $insert->id;
            }
        }

        $checkProduct = Product::where('code',$code)
            // ->where('name_variant',$name_variant)
            ->first();
        if($checkProduct){
            $productId = $checkProduct->id;
            $update = Product::find($productId);
            $update->img = $imagePath;
            $update->cost = $cost;
            $update->price = $price;
            $update->qty = $qty;
            $update->product_category_id = $category;
            $update->save();
        }else{
            $insert = new Product;
            $insert->code = $code;
            $insert->name = $name;
            $insert->variant = $variant;
            $insert->name_variant = $name_variant;
            $insert->cost = $cost;
            $insert->price = $price;
            $insert->qty = $qty;
            $insert->restock_date = date('Y-m-d');
            $insert->product_status = 'Available';        
            $insert->product_category_id = $category;
            $insert->img = $imagePath;
            $insert->updated_by = 1;
            $insert->created_by = 1;
            $insert->save();
            $productId = $insert->id;
        }

        $checkProductPrice = ProductsPrice::where('product_id',$productId)
            ->where('cost',$cost)
            ->where('price',$price)
            ->first();
        if($checkProductPrice){
            $update = ProductsPrice::find($checkProductPrice->id);
            $update->supplier_id = $supplierId;
            $update->cost = $cost;
            $update->price = $price;
            $update->qty = $qty;
            $update->save();
        }else{
            $insert = new ProductsPrice;
            $insert->product_id = $productId;
            $insert->supplier_id = $supplierId;
            $insert->cost = $cost;
            $insert->price = $price;
            $insert->qty = $qty;
            $insert->discount = 0.0;
            $insert->discount_percentage = 0.0;
            $insert->effective_date = date('Y-m-d');
            $insert->restock_date = date('Y-m-d');
            $insert->updated_by = 1;
            $insert->created_by = 1;
            $insert->save();
        }

        $totalQty = ProductsPrice::where('product_id',$productId)->sum('qty');
        $update = Product::find($productId);
        $update->qty = $totalQty;
        $update->save();
        $this->currentRow++;
    }

    private function formatPrice($price)
    {
        if ($price === null || trim($price) === '') {
            return 0.0;
        }
        return (float) str_replace([',', '₱'], '', $price);
    }
}
