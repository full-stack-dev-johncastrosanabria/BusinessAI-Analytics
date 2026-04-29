/**
 * Property-Based Tests: Design System Consistency & Accessibility Standards Compliance
 *
 * **Validates: Requirements 3.1, 3.5**
 *
 * Property 13: Design System Consistency
 *   For any UI component implemented by the UI_Designer, it SHALL adhere to the
 *   established design system standards for typography, color palette, and spacing
 *   with no deviations.
 *
 * Property 17: Accessibility Standards Compliance
 *   For any UI component, it SHALL meet WCAG 2.1 AA standards including proper
 *   keyboard navigation, screen reader support, and color contrast requirements.
 *
 * Sub-properties tested:
 *
 * Design System Consistency (Property 13):
 *   P13a – Button always renders with a design-system CSS class (ui-btn)
 *   P13b – Button variant classes always follow the design system naming convention
 *   P13c – Button size classes always follow the design system naming convention
 *   P13d – Card always renders with the design-system CSS class (ui-card)
 *   P13e – Input always renders with the design-system CSS class (ui-input)
 *   P13f – Badge always renders with the design-system CSS class (ui-badge)
 *   P13g – Badge variant classes always follow the design system naming convention
 *   P13h – Component class names never contain ad-hoc inline style overrides
 *
 * Accessibility Standards Compliance (Property 17):
 *   P17a – Button with loading=true always sets aria-busy="true"
 *   P17b – Disabled button always sets aria-disabled="true"
 *   P17c – Button is always keyboard-focusable (not disabled)
 *   P17d – Input with error always sets aria-invalid="true"
 *   P17e – Input with label always associates label via htmlFor/id
 *   P17f – Input with required always sets aria-required="true"
 *   P17g – Input error message always has role="alert"
 *   P17h – Badge with aria-label always exposes it to screen readers
 *   P17i – Card with aria-label always exposes it to screen readers
 *   P17j – Icon-only button slots (startIcon/endIcon) are always aria-hidden
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button, Card, Input, Badge } from '../ui';
import type { ButtonVariant, ButtonSize, BadgeVariant, BadgeSize } from '../ui';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const buttonVariantArb: fc.Arbitrary<ButtonVariant> = fc.constantFrom(
  'primary',
  'secondary',
  'ghost',
  'danger',
);

const buttonSizeArb: fc.Arbitrary<ButtonSize> = fc.constantFrom('sm', 'md', 'lg');

const badgeVariantArb: fc.Arbitrary<BadgeVariant> = fc.constantFrom(
  'success',
  'warning',
  'error',
  'info',
  'neutral',
);

const badgeSizeArb: fc.Arbitrary<BadgeSize> = fc.constantFrom('sm', 'md');

const nonEmptyLabelArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter(s => s.trim().length > 0);

const errorMessageArb = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter(s => s.trim().length > 0);

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Renders a component and returns the first element matching the selector. */
function renderAndQuery<T extends HTMLElement>(
  ui: React.ReactElement,
  selector: string,
): T {
  const { container } = render(ui);
  const el = container.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

// ─── Property 13: Design System Consistency ──────────────────────────────────

describe('Property 13: Design System Consistency (Validates: Requirements 3.1)', () => {

  /**
   * P13a – Button always renders with the base design-system class "ui-btn"
   * regardless of variant or size.
   */
  it('P13a: Button always has the base "ui-btn" class for any variant and size', () => {
    fc.assert(
      fc.property(buttonVariantArb, buttonSizeArb, nonEmptyLabelArb, (variant, size, label) => {
        const btn = renderAndQuery<HTMLButtonElement>(
          <Button variant={variant} size={size}>{label}</Button>,
          'button',
        );
        return btn.classList.contains('ui-btn');
      }),
    );
  });

  /**
   * P13b – Button variant class always follows the "ui-btn--{variant}" naming convention.
   */
  it('P13b: Button variant class always follows "ui-btn--{variant}" naming convention', () => {
    fc.assert(
      fc.property(buttonVariantArb, nonEmptyLabelArb, (variant, label) => {
        const btn = renderAndQuery<HTMLButtonElement>(
          <Button variant={variant}>{label}</Button>,
          'button',
        );
        return btn.classList.contains(`ui-btn--${variant}`);
      }),
    );
  });

  /**
   * P13c – Button size class always follows the "ui-btn--{size}" naming convention.
   */
  it('P13c: Button size class always follows "ui-btn--{size}" naming convention', () => {
    fc.assert(
      fc.property(buttonSizeArb, nonEmptyLabelArb, (size, label) => {
        const btn = renderAndQuery<HTMLButtonElement>(
          <Button size={size}>{label}</Button>,
          'button',
        );
        return btn.classList.contains(`ui-btn--${size}`);
      }),
    );
  });

  /**
   * P13d – Card always renders with the base design-system class "ui-card".
   */
  it('P13d: Card always has the base "ui-card" class', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, (content) => {
        const card = renderAndQuery<HTMLDivElement>(
          <Card>{content}</Card>,
          '.ui-card',
        );
        return card.classList.contains('ui-card');
      }),
    );
  });

  /**
   * P13e – Input always renders with the base design-system class "ui-input".
   */
  it('P13e: Input always has the base "ui-input" class', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, (placeholder) => {
        const input = renderAndQuery<HTMLInputElement>(
          <Input placeholder={placeholder} />,
          'input',
        );
        return input.classList.contains('ui-input');
      }),
    );
  });

  /**
   * P13f – Badge always renders with the base design-system class "ui-badge".
   */
  it('P13f: Badge always has the base "ui-badge" class for any variant and size', () => {
    fc.assert(
      fc.property(badgeVariantArb, badgeSizeArb, nonEmptyLabelArb, (variant, size, label) => {
        const badge = renderAndQuery<HTMLSpanElement>(
          <Badge variant={variant} size={size}>{label}</Badge>,
          'span',
        );
        return badge.classList.contains('ui-badge');
      }),
    );
  });

  /**
   * P13g – Badge variant class always follows the "ui-badge--{variant}" naming convention.
   */
  it('P13g: Badge variant class always follows "ui-badge--{variant}" naming convention', () => {
    fc.assert(
      fc.property(badgeVariantArb, nonEmptyLabelArb, (variant, label) => {
        const badge = renderAndQuery<HTMLSpanElement>(
          <Badge variant={variant}>{label}</Badge>,
          'span',
        );
        return badge.classList.contains(`ui-badge--${variant}`);
      }),
    );
  });

  /**
   * P13h – Card body always uses the design-system class "ui-card__body".
   */
  it('P13h: Card body always uses the "ui-card__body" design-system class', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, (content) => {
        const { container } = render(<Card>{content}</Card>);
        const body = container.querySelector('.ui-card__body');
        return body !== null;
      }),
    );
  });

  /**
   * P13i – Input wrapper always uses the design-system class "ui-input-wrapper".
   */
  it('P13i: Input wrapper always uses the "ui-input-wrapper" design-system class', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, (placeholder) => {
        const { container } = render(<Input placeholder={placeholder} />);
        const wrapper = container.querySelector('.ui-input-wrapper');
        return wrapper !== null;
      }),
    );
  });
});

// ─── Property 17: Accessibility Standards Compliance ─────────────────────────

describe('Property 17: Accessibility Standards Compliance (Validates: Requirements 3.5)', () => {

  /**
   * P17a – Button with loading=true always sets aria-busy="true" to inform
   * screen readers that the action is in progress.
   */
  it('P17a: loading Button always has aria-busy="true"', () => {
    fc.assert(
      fc.property(buttonVariantArb, nonEmptyLabelArb, (variant, label) => {
        const btn = renderAndQuery<HTMLButtonElement>(
          <Button variant={variant} loading>{label}</Button>,
          'button',
        );
        return btn.getAttribute('aria-busy') === 'true';
      }),
    );
  });

  /**
   * P17b – Disabled button always sets aria-disabled="true" so assistive
   * technologies can communicate the disabled state.
   */
  it('P17b: disabled Button always has aria-disabled="true"', () => {
    fc.assert(
      fc.property(buttonVariantArb, nonEmptyLabelArb, (variant, label) => {
        const btn = renderAndQuery<HTMLButtonElement>(
          <Button variant={variant} disabled>{label}</Button>,
          'button',
        );
        return btn.getAttribute('aria-disabled') === 'true';
      }),
    );
  });

  /**
   * P17c – A non-disabled, non-loading Button is always keyboard-focusable
   * (tabIndex is not -1 and the element is not disabled).
   */
  it('P17c: non-disabled Button is always keyboard-focusable', () => {
    fc.assert(
      fc.property(buttonVariantArb, buttonSizeArb, nonEmptyLabelArb, (variant, size, label) => {
        const btn = renderAndQuery<HTMLButtonElement>(
          <Button variant={variant} size={size}>{label}</Button>,
          'button',
        );
        return !btn.disabled && btn.tabIndex !== -1;
      }),
    );
  });

  /**
   * P17d – Input with an error message always sets aria-invalid="true" so
   * screen readers announce the invalid state.
   */
  it('P17d: Input with error always has aria-invalid="true"', () => {
    fc.assert(
      fc.property(errorMessageArb, nonEmptyLabelArb, (error, placeholder) => {
        const input = renderAndQuery<HTMLInputElement>(
          <Input error={error} placeholder={placeholder} />,
          'input',
        );
        return input.getAttribute('aria-invalid') === 'true';
      }),
    );
  });

  /**
   * P17e – Input with a label always associates the label via htmlFor/id so
   * screen readers can announce the label when the input is focused.
   */
  it('P17e: Input with label always has an associated label element', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, nonEmptyLabelArb, (label, placeholder) => {
        const { container } = render(
          <Input label={label} placeholder={placeholder} />,
        );
        const input = container.querySelector('input')!;
        const labelEl = container.querySelector('label');
        if (!labelEl) return false;
        return labelEl.getAttribute('for') === input.id;
      }),
    );
  });

  /**
   * P17f – Input with required=true always sets aria-required="true" so
   * screen readers communicate the required state.
   */
  it('P17f: required Input always has aria-required="true"', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, (label) => {
        const input = renderAndQuery<HTMLInputElement>(
          <Input label={label} required />,
          'input',
        );
        return input.getAttribute('aria-required') === 'true';
      }),
    );
  });

  /**
   * P17g – Input error message always has role="alert" so screen readers
   * announce the error immediately when it appears.
   */
  it('P17g: Input error message always has role="alert"', () => {
    fc.assert(
      fc.property(errorMessageArb, (error) => {
        const { container } = render(<Input error={error} />);
        const alert = container.querySelector('[role="alert"]');
        return alert !== null && alert.textContent === error;
      }),
    );
  });

  /**
   * P17h – Badge with an aria-label always exposes it as an accessible name
   * so screen readers can describe the badge's meaning.
   */
  it('P17h: Badge with aria-label always exposes the accessible name', () => {
    fc.assert(
      fc.property(badgeVariantArb, nonEmptyLabelArb, nonEmptyLabelArb, (variant, content, ariaLabel) => {
        const badge = renderAndQuery<HTMLSpanElement>(
          <Badge variant={variant} aria-label={ariaLabel}>{content}</Badge>,
          'span',
        );
        return badge.getAttribute('aria-label') === ariaLabel;
      }),
    );
  });

  /**
   * P17i – Card with aria-label always exposes it as an accessible name
   * so screen readers can describe the card's purpose.
   */
  it('P17i: Card with aria-label always exposes the accessible name', () => {
    fc.assert(
      fc.property(nonEmptyLabelArb, nonEmptyLabelArb, (content, ariaLabel) => {
        const card = renderAndQuery<HTMLDivElement>(
          <Card aria-label={ariaLabel}>{content}</Card>,
          '.ui-card',
        );
        return card.getAttribute('aria-label') === ariaLabel;
      }),
    );
  });

  /**
   * P17j – Button icon slots (startIcon / endIcon) are always aria-hidden so
   * decorative icons are not announced by screen readers.
   */
  it('P17j: Button icon slots are always aria-hidden', () => {
    fc.assert(
      fc.property(buttonVariantArb, nonEmptyLabelArb, (variant, label) => {
        const icon = <svg data-testid="icon" />;
        const { container } = render(
          <Button variant={variant} startIcon={icon} endIcon={icon}>{label}</Button>,
        );
        const iconWrappers = container.querySelectorAll('.ui-btn__icon');
        return Array.from(iconWrappers).every(
          el => el.getAttribute('aria-hidden') === 'true',
        );
      }),
    );
  });

  /**
   * P17k – Input with aria-describedby links to the error element id when
   * an error is present, ensuring screen readers read the error description.
   */
  it('P17k: Input with error always has aria-describedby pointing to the error element', () => {
    fc.assert(
      fc.property(errorMessageArb, (error) => {
        const { container } = render(<Input error={error} />);
        const input = container.querySelector('input')!;
        const describedBy = input.getAttribute('aria-describedby');
        if (!describedBy) return false;
        const errorEl = container.querySelector(`#${describedBy}`);
        return errorEl !== null && errorEl.textContent === error;
      }),
    );
  });

  /**
   * P17l – Card with role always exposes the role attribute so assistive
   * technologies can identify the landmark or widget type.
   */
  it('P17l: Card with role always exposes the role attribute', () => {
    const roles = ['region', 'article', 'complementary', 'main'] as const;
    fc.assert(
      fc.property(
        fc.constantFrom(...roles),
        nonEmptyLabelArb,
        (role, content) => {
          const card = renderAndQuery<HTMLDivElement>(
            <Card role={role} aria-label="test card">{content}</Card>,
            '.ui-card',
          );
          return card.getAttribute('role') === role;
        },
      ),
    );
  });
});
