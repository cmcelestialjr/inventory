<?php

namespace Database\Seeders;

use App\Models\AdvanceStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdvanceStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [            
            'Active',
            'Pending',
            'Paid',
            'Cancelled',
        ];

        foreach ($statuses as $statusName) {
            AdvanceStatus::updateOrCreate(
                ['name' => $statusName],
                ['name' => $statusName]
            );
        }
    }
}
