import Field from "../Field";
import MonthSelector from "../MonthSelector";

type FilterMonthInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function FilterMonthInput({
  id,
  label,
  value,
  onChange,
}: FilterMonthInputProps) {
  return (
    <Field htmlFor={id} label={label}>
      <MonthSelector id={id} onChange={onChange} value={value} />
    </Field>
  );
}
