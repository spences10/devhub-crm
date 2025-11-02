# Form Input Types Reference

Complete reference for all form input types using daisyUI v5 patterns.

For basic form structure and v4→v5 migration, see the `form-patterns`
skill.

## Important: Number Input Validation

**CRITICAL:** HTML number inputs send their values as **strings** in
form data, not numbers. You must transform them in your validation
schema.

### ❌ Wrong (will fail validation)

```typescript
export const my_form = form(
	v.object({
		age: v.number(), // ❌ Will fail - receives string "25", not 25
	}),
	async (data) => {
		// ...
	},
);
```

### ✅ Correct (transforms string to number)

```typescript
export const my_form = form(
	v.object({
		age: v.pipe(
			v.string(), // 1. Accept the string
			v.transform(Number), // 2. Transform to number
			v.number(), // 3. Validate it's a number
			v.minValue(0), // 4. Apply number validations
			v.maxValue(120),
		),
	}),
	async (data) => {
		// data.age is now a number
	},
);
```

**Why this happens:** HTML forms serialize all input values as
strings, regardless of the input type. The `type="number"` attribute
only provides client-side validation and a numeric keyboard on mobile,
but the submitted value is still a string.

**Commands vs Forms:** This only applies to `form()` functions. With
`command()` functions called from JavaScript, you can pass actual
numbers directly.

## Text Inputs

### Basic Text

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Name</legend>
	<label class="validator input w-full">
		<input type="text" name="name" class="grow" required />
	</label>
</fieldset>
```

### Email

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Email</legend>
	<label class="validator input w-full">
		<input type="email" name="email" class="grow" required />
	</label>
</fieldset>
```

### Password

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Password</legend>
	<label class="validator input w-full">
		<input
			type="password"
			name="password"
			class="grow"
			required
			minlength="8"
		/>
	</label>
	<p class="label">At least 8 characters</p>
</fieldset>
```

### Number

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Age</legend>
	<label class="validator input w-full">
		<input type="number" name="age" class="grow" min="0" max="120" />
	</label>
</fieldset>
```

### URL

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Website</legend>
	<label class="validator input w-full">
		<input
			type="url"
			name="website"
			class="grow"
			placeholder="https://example.com"
		/>
	</label>
</fieldset>
```

### Tel (Phone)

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Phone</legend>
	<label class="validator input w-full">
		<input
			type="tel"
			name="phone"
			class="grow"
			placeholder="+1 (555) 123-4567"
		/>
	</label>
</fieldset>
```

### Date

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Birthday</legend>
	<label class="input w-full">
		<input type="date" name="birthday" class="grow" />
	</label>
</fieldset>
```

## Textarea

**Important:** Unlike inputs, textareas do NOT use a `<label>`
wrapper. Apply classes directly to the `<textarea>` element.

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Notes</legend>
	<textarea
		name="notes"
		class="textarea w-full"
		rows="4"
		placeholder="Enter your notes"
	></textarea>
</fieldset>
```

❌ **Wrong** (don't wrap textarea in label):

```svelte
<label class="textarea w-full">
	<textarea name="notes" class="grow"></textarea>
</label>
```

## Select/Dropdown

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Country</legend>
	<select name="country" class="select w-full">
		<option disabled selected>Select a country</option>
		<option value="us">United States</option>
		<option value="uk">United Kingdom</option>
		<option value="ca">Canada</option>
	</select>
</fieldset>
```

### Select with Validation

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Role</legend>
	<select name="role" class="select w-full" required>
		<option value="" disabled selected>Choose a role</option>
		<option value="admin">Admin</option>
		<option value="user">User</option>
		<option value="guest">Guest</option>
	</select>
</fieldset>
```

## Checkbox

### Single Checkbox

```svelte
<div class="form-control">
	<label class="label cursor-pointer justify-start gap-4">
		<input type="checkbox" name="agree" class="checkbox" required />
		<span class="label-text">I agree to the terms and conditions</span
		>
	</label>
</div>
```

### Multiple Checkboxes

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Interests</legend>
	<div class="space-y-2">
		<label class="label cursor-pointer justify-start gap-4">
			<input
				type="checkbox"
				name="interests"
				value="tech"
				class="checkbox"
			/>
			<span class="label-text">Technology</span>
		</label>
		<label class="label cursor-pointer justify-start gap-4">
			<input
				type="checkbox"
				name="interests"
				value="design"
				class="checkbox"
			/>
			<span class="label-text">Design</span>
		</label>
		<label class="label cursor-pointer justify-start gap-4">
			<input
				type="checkbox"
				name="interests"
				value="business"
				class="checkbox"
			/>
			<span class="label-text">Business</span>
		</label>
	</div>
</fieldset>
```

## Radio Buttons

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Plan</legend>
	<div class="space-y-2">
		<label class="label cursor-pointer justify-start gap-4">
			<input
				type="radio"
				name="plan"
				value="free"
				class="radio"
				checked
			/>
			<span class="label-text">Free</span>
		</label>
		<label class="label cursor-pointer justify-start gap-4">
			<input type="radio" name="plan" value="pro" class="radio" />
			<span class="label-text">Pro ($9/mo)</span>
		</label>
		<label class="label cursor-pointer justify-start gap-4">
			<input
				type="radio"
				name="plan"
				value="enterprise"
				class="radio"
			/>
			<span class="label-text">Enterprise ($99/mo)</span>
		</label>
	</div>
</fieldset>
```

## File Upload

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Profile Picture</legend>
	<input
		type="file"
		name="avatar"
		class="file-input-bordered file-input w-full"
		accept="image/*"
	/>
</fieldset>
```

### Multiple Files

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Documents</legend>
	<input
		type="file"
		name="documents"
		class="file-input-bordered file-input w-full"
		multiple
		accept=".pdf,.doc,.docx"
	/>
</fieldset>
```

## Toggle Switch

```svelte
<div class="form-control">
	<label class="label cursor-pointer justify-start gap-4">
		<input type="checkbox" name="notifications" class="toggle" />
		<span class="label-text">Enable notifications</span>
	</label>
</div>
```

## Range Slider

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Volume</legend>
	<input
		type="range"
		name="volume"
		min="0"
		max="100"
		value="50"
		class="range"
	/>
	<div class="flex w-full justify-between px-2 text-xs">
		<span>0</span>
		<span>50</span>
		<span>100</span>
	</div>
</fieldset>
```

## Color Picker

```svelte
<fieldset class="fieldset">
	<legend class="fieldset-legend">Theme Color</legend>
	<input
		type="color"
		name="color"
		value="#3b82f6"
		class="h-12 w-full cursor-pointer"
	/>
</fieldset>
```

## Input Sizes

### Small

```svelte
<label class="input input-sm w-full">
	<input type="text" class="grow" />
</label>
```

### Medium (Default)

```svelte
<label class="input w-full">
	<input type="text" class="grow" />
</label>
```

### Large

```svelte
<label class="input input-lg w-full">
	<input type="text" class="grow" />
</label>
```

## Input States

### Disabled

```svelte
<label class="input w-full">
	<input type="text" class="grow" disabled />
</label>
```

### Read-only

```svelte
<label class="input w-full">
	<input type="text" class="grow" readonly value="Read only value" />
</label>
```

## Input with Icons

### Left Icon

```svelte
<label class="input w-full flex items-center gap-2">
  <svg class="h-4 w-4 opacity-70" /* ... */><!-- icon --></svg>
  <input type="text" class="grow" placeholder="Search" />
</label>
```

### Right Icon

```svelte
<label class="input w-full flex items-center gap-2">
  <input type="text" class="grow" placeholder="Email" />
  <svg class="h-4 w-4 opacity-70" /* ... */><!-- icon --></svg>
</label>
```

## Validation Attributes

```html
<!-- Required -->
<input required />

<!-- Min/max length -->
<input minlength="8" maxlength="20" />

<!-- Pattern (regex) -->
<input pattern="[A-Za-z0-9]+" />

<!-- Min/max values (numbers) -->
<input type="number" min="0" max="100" />

<!-- Step (numbers) -->
<input type="number" step="0.01" />
```
