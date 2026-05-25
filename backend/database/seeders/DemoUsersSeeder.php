<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'super.admin@eduguard.test',
                'role' => 'super_admin',
                'school_id' => null,
            ],
            [
                'name' => 'Ministry Admin',
                'email' => 'ministry.admin@eduguard.test',
                'role' => 'ministry_admin',
                'school_id' => null,
            ],
            [
                'name' => 'School Admin',
                'email' => 'school.admin@eduguard.test',
                'role' => 'school_admin',
                'school_id' => 1,
            ],
            [
                'name' => 'Teacher',
                'email' => 'teacher@eduguard.test',
                'role' => 'teacher',
                'school_id' => 1,
            ],
            [
                'name' => 'Counselor',
                'email' => 'counselor@eduguard.test',
                'role' => 'counselor',
                'school_id' => 1,
            ],
            [
                'name' => 'Data Entry',
                'email' => 'data.entry@eduguard.test',
                'role' => 'data_entry',
                'school_id' => 1,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'school_id' => $userData['school_id'],
                    'is_active' => true,
                ]
            );

            $user->syncRoles([$userData['role']]);
        }
    }
}