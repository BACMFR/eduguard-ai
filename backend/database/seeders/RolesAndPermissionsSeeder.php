<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'view_dashboard',

            'view_schools',
            'manage_schools',

            'view_classrooms',
            'manage_classrooms',

            'view_students',
            'manage_students',

            'view_attendance',
            'manage_attendance',

            'view_grades',
            'manage_grades',

            'view_reports',

            'view_risk_scores',
            'calculate_risk_scores',

            'manage_users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $superAdmin = Role::firstOrCreate([
            'name' => 'super_admin',
            'guard_name' => 'web',
        ]);

        $ministryAdmin = Role::firstOrCreate([
            'name' => 'ministry_admin',
            'guard_name' => 'web',
        ]);

        $schoolAdmin = Role::firstOrCreate([
            'name' => 'school_admin',
            'guard_name' => 'web',
        ]);

        $teacher = Role::firstOrCreate([
            'name' => 'teacher',
            'guard_name' => 'web',
        ]);

        $counselor = Role::firstOrCreate([
            'name' => 'counselor',
            'guard_name' => 'web',
        ]);

        $dataEntry = Role::firstOrCreate([
            'name' => 'data_entry',
            'guard_name' => 'web',
        ]);

        $superAdmin->syncPermissions($permissions);

        $ministryAdmin->syncPermissions([
            'view_dashboard',
            'view_schools',
            'manage_schools',
            'view_classrooms',
            'manage_classrooms',
            'view_students',
            'manage_students',
            'view_attendance',
            'manage_attendance',
            'view_grades',
            'manage_grades',
            'view_reports',
            'view_risk_scores',
            'calculate_risk_scores',
        ]);

        $schoolAdmin->syncPermissions([
            'view_dashboard',
            'view_schools',
            'view_classrooms',
            'manage_classrooms',
            'view_students',
            'manage_students',
            'view_attendance',
            'manage_attendance',
            'view_grades',
            'manage_grades',
            'view_reports',
            'view_risk_scores',
            'calculate_risk_scores',
        ]);

        $teacher->syncPermissions([
            'view_dashboard',
            'view_classrooms',
            'view_students',
            'view_attendance',
            'manage_attendance',
            'view_grades',
            'manage_grades',
        ]);

        $counselor->syncPermissions([
            'view_dashboard',
            'view_students',
            'view_attendance',
            'view_grades',
            'view_reports',
            'view_risk_scores',
            'calculate_risk_scores',
        ]);

        $dataEntry->syncPermissions([
            'view_dashboard',
            'view_schools',
            'view_classrooms',
            'view_students',
            'manage_students',
            'view_attendance',
            'manage_attendance',
            'view_grades',
            'manage_grades',
            'view_reports',
        ]);
    }
}