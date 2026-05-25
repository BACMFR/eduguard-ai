<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EduGuardDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = now();

            $governorateId = $this->upsertAndGetId('governorates', 'code', 'DEMO-GOV', [
                'name' => 'Demo Governorate',
                'code' => 'DEMO-GOV',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $districtNorthId = $this->upsertAndGetId('districts', 'code', 'DEMO-D-NORTH', [
                'governorate_id' => $governorateId,
                'name' => 'North District',
                'code' => 'DEMO-D-NORTH',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $districtSouthId = $this->upsertAndGetId('districts', 'code', 'DEMO-D-SOUTH', [
                'governorate_id' => $governorateId,
                'name' => 'South District',
                'code' => 'DEMO-D-SOUTH',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $schoolOneId = $this->upsertAndGetId('schools', 'code', 'DEMO-SCH-001', [
                'governorate_id' => $governorateId,
                'district_id' => $districtNorthId,
                'name' => 'EduGuard Demo School One',
                'code' => 'DEMO-SCH-001',
                'type' => 'public',
                'gender_type' => 'mixed',
                'address' => 'Demo Street 1',
                'phone' => '+963900000001',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $schoolTwoId = $this->upsertAndGetId('schools', 'code', 'DEMO-SCH-002', [
                'governorate_id' => $governorateId,
                'district_id' => $districtSouthId,
                'name' => 'EduGuard Demo School Two',
                'code' => 'DEMO-SCH-002',
                'type' => 'public',
                'gender_type' => 'mixed',
                'address' => 'Demo Street 2',
                'phone' => '+963900000002',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $classroomOneAId = $this->upsertAndGetId('classrooms', ['school_id', 'name'], [$schoolOneId, 'Grade 9 A'], [
                'school_id' => $schoolOneId,
                'name' => 'Grade 9 A',
                'grade_level' => 9,
                'section' => 'A',
                'capacity' => 35,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $classroomOneBId = $this->upsertAndGetId('classrooms', ['school_id', 'name'], [$schoolOneId, 'Grade 9 B'], [
                'school_id' => $schoolOneId,
                'name' => 'Grade 9 B',
                'grade_level' => 9,
                'section' => 'B',
                'capacity' => 35,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $classroomTwoAId = $this->upsertAndGetId('classrooms', ['school_id', 'name'], [$schoolTwoId, 'Grade 10 A'], [
                'school_id' => $schoolTwoId,
                'name' => 'Grade 10 A',
                'grade_level' => 10,
                'section' => 'A',
                'capacity' => 32,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $guardianIds = [];
            foreach ([
                ['full_name' => 'Omar Al Ahmad', 'national_id' => 'DEMO-G-001', 'phone' => '+963911111111', 'email' => 'omar.guardian@eduguard.test', 'relationship' => 'father'],
                ['full_name' => 'Maha Hassan', 'national_id' => 'DEMO-G-002', 'phone' => '+963922222222', 'email' => 'maha.guardian@eduguard.test', 'relationship' => 'mother'],
                ['full_name' => 'Nour Ali', 'national_id' => 'DEMO-G-003', 'phone' => '+963933333333', 'email' => 'nour.guardian@eduguard.test', 'relationship' => 'mother'],
                ['full_name' => 'Samer Khaled', 'national_id' => 'DEMO-G-004', 'phone' => '+963944444444', 'email' => 'samer.guardian@eduguard.test', 'relationship' => 'father'],
            ] as $guardian) {
                $guardianIds[] = $this->upsertAndGetId('guardians', 'national_id', $guardian['national_id'], [
                    ...$guardian,
                    'address' => 'Demo Address',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $students = [
                [
                    'school_id' => $schoolOneId,
                    'classroom_id' => $classroomOneAId,
                    'guardian_id' => $guardianIds[0],
                    'student_number' => 'DEMO-STU-001',
                    'national_id' => 'DEMO-NID-001',
                    'first_name' => 'Lina',
                    'last_name' => 'Omar',
                    'gender' => 'female',
                    'birth_date' => '2011-03-12',
                    'status' => 'active',
                    'face_registered' => true,
                ],
                [
                    'school_id' => $schoolOneId,
                    'classroom_id' => $classroomOneAId,
                    'guardian_id' => $guardianIds[1],
                    'student_number' => 'DEMO-STU-002',
                    'national_id' => 'DEMO-NID-002',
                    'first_name' => 'Adam',
                    'last_name' => 'Hassan',
                    'gender' => 'male',
                    'birth_date' => '2010-11-21',
                    'status' => 'active',
                    'face_registered' => false,
                ],
                [
                    'school_id' => $schoolOneId,
                    'classroom_id' => $classroomOneBId,
                    'guardian_id' => $guardianIds[2],
                    'student_number' => 'DEMO-STU-003',
                    'national_id' => 'DEMO-NID-003',
                    'first_name' => 'Sara',
                    'last_name' => 'Ali',
                    'gender' => 'female',
                    'birth_date' => '2011-07-09',
                    'status' => 'active',
                    'face_registered' => false,
                ],
                [
                    'school_id' => $schoolTwoId,
                    'classroom_id' => $classroomTwoAId,
                    'guardian_id' => $guardianIds[3],
                    'student_number' => 'DEMO-STU-004',
                    'national_id' => 'DEMO-NID-004',
                    'first_name' => 'Yazan',
                    'last_name' => 'Khaled',
                    'gender' => 'male',
                    'birth_date' => '2010-01-28',
                    'status' => 'active',
                    'face_registered' => false,
                ],
            ];

            $studentIds = [];
            foreach ($students as $student) {
                $studentIds[$student['student_number']] = $this->upsertAndGetId('students', 'student_number', $student['student_number'], [
                    ...$student,
                    'enrollment_date' => Carbon::now()->subYears(2)->toDateString(),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $subjects = [
                ['name' => 'Mathematics', 'code' => 'DEMO-MATH'],
                ['name' => 'Science', 'code' => 'DEMO-SCI'],
                ['name' => 'Arabic', 'code' => 'DEMO-ARB'],
                ['name' => 'English', 'code' => 'DEMO-ENG'],
            ];

            $subjectIds = [];
            foreach ($subjects as $subject) {
                $subjectIds[$subject['code']] = $this->upsertAndGetId('subjects', 'code', $subject['code'], [
                    ...$subject,
                    'description' => "{$subject['name']} demo subject",
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('grades')
                ->whereIn('student_id', array_values($studentIds))
                ->delete();

            foreach ($studentIds as $studentNumber => $studentId) {
                $schoolId = str_ends_with($studentNumber, '004') ? $schoolTwoId : $schoolOneId;
                $classroomId = str_ends_with($studentNumber, '004') ? $classroomTwoAId : $classroomOneAId;

                foreach ($subjectIds as $code => $subjectId) {
                    $score = match ($studentNumber) {
                        'DEMO-STU-002' => rand(42, 68),
                        'DEMO-STU-003' => rand(55, 75),
                        default => rand(70, 96),
                    };

                    DB::table('grades')->insert([
                        'student_id' => $studentId,
                        'school_id' => $schoolId,
                        'classroom_id' => $classroomId,
                        'subject_id' => $subjectId,
                        'exam_name' => 'Demo Midterm',
                        'grade_type' => 'midterm',
                        'score' => $score,
                        'max_score' => 100,
                        'exam_date' => Carbon::now()->subDays(rand(2, 20))->toDateString(),
                        'notes' => 'Demo grade seeded for testing.',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }

            $this->seedAttendance($schoolOneId, $classroomOneAId, [
                $studentIds['DEMO-STU-001'],
                $studentIds['DEMO-STU-002'],
            ]);

            $this->seedAttendance($schoolTwoId, $classroomTwoAId, [
                $studentIds['DEMO-STU-004'],
            ]);

            DB::table('student_risk_score_details')
                ->whereIn('student_risk_score_id', DB::table('student_risk_scores')->whereIn('student_id', array_values($studentIds))->pluck('id'))
                ->delete();

            DB::table('student_risk_scores')
                ->whereIn('student_id', array_values($studentIds))
                ->delete();

            $riskScoreIds = [];
            foreach ([
                'DEMO-STU-001' => ['score' => 22, 'level' => 'low', 'summary' => 'Stable attendance and academic performance.'],
                'DEMO-STU-002' => ['score' => 78, 'level' => 'high', 'summary' => 'High absence rate and low grades require immediate follow-up.'],
                'DEMO-STU-003' => ['score' => 61, 'level' => 'medium', 'summary' => 'Moderate risk due to inconsistent attendance.'],
                'DEMO-STU-004' => ['score' => 86, 'level' => 'critical', 'summary' => 'Critical risk due to frequent absence and poor performance.'],
            ] as $studentNumber => $risk) {
                $studentId = $studentIds[$studentNumber];
                $schoolId = $studentNumber === 'DEMO-STU-004' ? $schoolTwoId : $schoolOneId;
                $classroomId = $studentNumber === 'DEMO-STU-004' ? $classroomTwoAId : ($studentNumber === 'DEMO-STU-003' ? $classroomOneBId : $classroomOneAId);

                $riskScoreIds[$studentNumber] = DB::table('student_risk_scores')->insertGetId([
                    'student_id' => $studentId,
                    'school_id' => $schoolId,
                    'classroom_id' => $classroomId,
                    'score' => $risk['score'],
                    'level' => $risk['level'],
                    'calculated_from' => Carbon::now()->subDays(30)->toDateString(),
                    'calculated_to' => Carbon::now()->toDateString(),
                    'model_version' => 'rule_based_v1',
                    'calculated_at' => Carbon::now()->subHours(3),
                    'summary' => $risk['summary'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('interventions')
                ->whereIn('student_id', array_values($studentIds))
                ->delete();

            DB::table('interventions')->insert([
                [
                    'student_id' => $studentIds['DEMO-STU-002'],
                    'school_id' => $schoolOneId,
                    'classroom_id' => $classroomOneAId,
                    'risk_score_id' => $riskScoreIds['DEMO-STU-002'],
                    'assigned_to' => null,
                    'type' => 'parent_meeting',
                    'priority' => 'high',
                    'status' => 'open',
                    'title' => 'Parent meeting for attendance follow-up',
                    'description' => 'Student has repeated absences and needs guardian follow-up.',
                    'action_plan' => 'Schedule meeting with guardian and agree attendance improvement plan.',
                    'due_date' => Carbon::now()->addDays(3)->toDateString(),
                    'completed_at' => null,
                    'outcome_notes' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'student_id' => $studentIds['DEMO-STU-004'],
                    'school_id' => $schoolTwoId,
                    'classroom_id' => $classroomTwoAId,
                    'risk_score_id' => $riskScoreIds['DEMO-STU-004'],
                    'assigned_to' => null,
                    'type' => 'home_visit',
                    'priority' => 'critical',
                    'status' => 'in_progress',
                    'title' => 'Urgent home visit',
                    'description' => 'Critical risk student requires immediate counselor intervention.',
                    'action_plan' => 'Coordinate home visit and document barriers to attendance.',
                    'due_date' => Carbon::now()->addDay()->toDateString(),
                    'completed_at' => null,
                    'outcome_notes' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'student_id' => $studentIds['DEMO-STU-003'],
                    'school_id' => $schoolOneId,
                    'classroom_id' => $classroomOneBId,
                    'risk_score_id' => $riskScoreIds['DEMO-STU-003'],
                    'assigned_to' => null,
                    'type' => 'academic_support',
                    'priority' => 'medium',
                    'status' => 'completed',
                    'title' => 'Academic support plan',
                    'description' => 'Support student in mathematics and science.',
                    'action_plan' => 'Weekly tutoring sessions for four weeks.',
                    'due_date' => Carbon::now()->subDays(2)->toDateString(),
                    'completed_at' => Carbon::now()->subDay(),
                    'outcome_notes' => 'Student attended first support session.',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);

            $this->createDemoUser(
                'Ministry Admin',
                'ministry.admin@eduguard.test',
                'ministry_admin',
                null,
                null,
                null
            );

            $this->createDemoUser(
                'School Admin',
                'school.admin@eduguard.test',
                'school_admin',
                $governorateId,
                $districtNorthId,
                $schoolOneId
            );

            $this->createDemoUser(
                'Teacher',
                'teacher@eduguard.test',
                'teacher',
                $governorateId,
                $districtNorthId,
                $schoolOneId
            );

            $this->createDemoUser(
                'Counselor',
                'counselor@eduguard.test',
                'counselor',
                $governorateId,
                $districtNorthId,
                $schoolOneId
            );
        });
    }

    private function upsertAndGetId(string $table, string|array $key, string|array $value, array $data): int
    {
        $criteria = is_array($key)
            ? array_combine($key, $value)
            : [$key => $value];

        DB::table($table)->updateOrInsert($criteria, $data);

        return (int) DB::table($table)
            ->where($criteria)
            ->value('id');
    }

    private function seedAttendance(int $schoolId, int $classroomId, array $studentIds): void
    {
        $now = now();

        for ($daysAgo = 4; $daysAgo >= 0; $daysAgo--) {
            $date = Carbon::now()->subDays($daysAgo)->toDateString();

            DB::table('attendance_sessions')->updateOrInsert(
                [
                    'school_id' => $schoolId,
                    'classroom_id' => $classroomId,
                    'session_date' => $date,
                    'source' => $daysAgo === 0 ? 'camera' : 'manual',
                ],
                [
                    'start_time' => '08:00:00',
                    'end_time' => '08:20:00',
                    'status' => $daysAgo === 0 ? 'draft' : 'reviewed',
                    'notes' => 'Demo attendance session.',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $sessionId = (int) DB::table('attendance_sessions')
                ->where([
                    'school_id' => $schoolId,
                    'classroom_id' => $classroomId,
                    'session_date' => $date,
                    'source' => $daysAgo === 0 ? 'camera' : 'manual',
                ])
                ->value('id');

            foreach ($studentIds as $index => $studentId) {
                $status = ($index === 1 && $daysAgo % 2 === 0) ? 'absent' : 'present';

                DB::table('attendance_records')->updateOrInsert(
                    [
                        'attendance_session_id' => $sessionId,
                        'student_id' => $studentId,
                    ],
                    [
                        'status' => $status,
                        'detection_method' => $daysAgo === 0 ? 'face_ai' : 'manual',
                        'confidence' => $daysAgo === 0 && $status === 'present' ? 91.5 : null,
                        'review_status' => $daysAgo === 0 ? 'pending' : 'confirmed',
                        'reviewed_by' => null,
                        'reviewed_at' => null,
                        'notes' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }

    private function createDemoUser(
        string $name,
        string $email,
        string $role,
        ?int $governorateId,
        ?int $districtId,
        ?int $schoolId
    ): void {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'is_active' => true,
                'governorate_id' => $governorateId,
                'district_id' => $districtId,
                'school_id' => $schoolId,
            ]
        );

        $user->syncRoles([$role]);
    }
}
