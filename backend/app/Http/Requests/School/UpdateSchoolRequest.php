<?php
namespace App\Http\Requests\School;

use App\Enums\SchoolGenderType;
use App\Enums\SchoolType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $school = $this->route('school');

        return [
            'governorate_id' => ['sometimes', 'required', 'integer', 'exists:governorates,id'],
            'district_id'    => ['sometimes', 'required', 'integer', 'exists:districts,id'],

            'name'           => ['sometimes', 'required', 'string', 'max:255'],

            'code'           => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('schools', 'code')->ignore($school?->id),
            ],

            'type'           => ['sometimes', 'required', Rule::enum(SchoolType::class)],
            'gender_type'    => ['sometimes', 'required', Rule::enum(SchoolGenderType::class)],

            'address'        => ['nullable', 'string', 'max:500'],
            'phone'          => ['nullable', 'string', 'max:50'],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }
}
