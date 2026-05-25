<?php
namespace App\Http\Requests\School;

use App\Enums\SchoolGenderType;
use App\Enums\SchoolType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'governorate_id' => ['required', 'integer', 'exists:governorates,id'],
            'district_id'    => ['required', 'integer', 'exists:districts,id'],

            'name'           => ['required', 'string', 'max:255'],
            'code'           => ['nullable', 'string', 'max:50', 'unique:schools,code'],

            'type'           => ['required', Rule::enum(SchoolType::class)],
            'gender_type'    => ['required', Rule::enum(SchoolGenderType::class)],

            'address'        => ['nullable', 'string', 'max:500'],
            'phone'          => ['nullable', 'string', 'max:50'],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }
}
