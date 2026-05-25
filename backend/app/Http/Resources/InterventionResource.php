<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,

            'student'       => $this->student ? [
                'id'             => $this->student->id,
                'student_number' => $this->student->student_number,
                'full_name'      => $this->student->full_name,
                'status'         => $this->student->status,
            ] : null,

            'school'        => $this->school ? [
                'id'   => $this->school->id,
                'name' => $this->school->name,
                'code' => $this->school->code,
            ] : null,

            'classroom'     => $this->classroom ? [
                'id'          => $this->classroom->id,
                'name'        => $this->classroom->name,
                'grade_level' => $this->classroom->grade_level,
                'section'     => $this->classroom->section,
            ] : null,

            'risk_score'    => $this->riskScore ? [
                'id'            => $this->riskScore->id,
                'score'         => $this->riskScore->score,
                'level'         => [
                    'value' => is_object($this->riskScore->level)
                        ? $this->riskScore->level->value
                        : $this->riskScore->level,

                    'label' => is_object($this->riskScore->level)
                        ? str($this->riskScore->level->value)->replace('_', ' ')->title()->toString()
                        : str((string) $this->riskScore->level)->replace('_', ' ')->title()->toString(),
                ],
                'calculated_at' => $this->riskScore->calculated_at?->toDateTimeString(),
            ] : null,

            'assigned_to'   => $this->assignedUser ? [
                'id'    => $this->assignedUser->id,
                'name'  => $this->assignedUser->name,
                'email' => $this->assignedUser->email,
            ] : null,

            'type'          => [
                'value' => $this->type,
                'label' => str($this->type)->replace('_', ' ')->title()->toString(),
            ],

            'priority'      => [
                'value' => $this->priority,
                'label' => str($this->priority)->replace('_', ' ')->title()->toString(),
            ],

            'status'        => [
                'value' => $this->status,
                'label' => str($this->status)->replace('_', ' ')->title()->toString(),
            ],

            'title'         => $this->title,
            'description'   => $this->description,
            'action_plan'   => $this->action_plan,
            'due_date'      => $this->due_date?->toDateString(),
            'completed_at'  => $this->completed_at?->toDateTimeString(),
            'outcome_notes' => $this->outcome_notes,

            'created_at'    => $this->created_at?->toDateTimeString(),
            'updated_at'    => $this->updated_at?->toDateTimeString(),
        ];
    }
}
