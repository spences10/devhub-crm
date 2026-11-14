/**
 * UI Component Library
 *
 * Atomic, reusable UI components following DaisyUI design system.
 * All components use Svelte 5 runes and follow snake_case naming conventions.
 *
 * @example
 * ```svelte
 * import { Button, Input, Field } from '#lib/components/ui/index.ts';
 *
 * <Field legend="Email">
 *   <Input type="email" name="email" required validator />
 * </Field>
 *
 * <Button variant="primary" loading={is_saving}>Save</Button>
 * ```
 */

export { default as Button } from './button.svelte';
export { default as Checkbox } from './checkbox.svelte';
export { default as Field } from './field.svelte';
export { default as Input } from './input.svelte';
export { default as Radio } from './radio.svelte';
export { default as Select } from './select.svelte';
export { default as Textarea } from './textarea.svelte';
