import { memo } from 'react';
import { classNames } from '~/utils/classNames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  type?: 'button' | 'submit' | 'reset';
}

type ButtonWithChildrenProps = {
  children: React.ReactNode;
  icon?: string;
  iconPosition?: 'start' | 'end';
  'aria-label'?: string;
} & BaseButtonProps;

type ButtonIconOnlyProps = {
  children?: never;
  icon: string;
  iconPosition?: never;
  'aria-label': string; // required for icon-only buttons
} & BaseButtonProps;

type ButtonProps = ButtonWithChildrenProps | ButtonIconOnlyProps;

export const Button = memo(
  ({
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled = false,
    active = false,
    icon,
    iconPosition = 'start',
    className,
    onClick,
    children,
    type = 'button',
    'aria-label': ariaLabel,
  }: ButtonProps) => {
    const isIconOnly: boolean = !children && !!icon;
    const isDisabled = disabled || loading;

    return (
      <button
        type={type}
        className={classNames(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-theme focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive focus:ring-offset-2',
          getVariantClasses(variant, active, isDisabled),
          getSizeClasses(size, isIconOnly),
          {
            'cursor-not-allowed opacity-50': isDisabled,
            'cursor-wait': loading,
          },
          className,
        )}
        disabled={isDisabled}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {loading && <div className="i-svg-spinners:90-ring-with-bg text-current" aria-hidden="true" />}
        {!loading && icon && (iconPosition === 'start' || isIconOnly) && (
          <div className={classNames(icon, getIconSize(size))} aria-hidden="true" />
        )}
        {children}
        {!loading && icon && iconPosition === 'end' && !isIconOnly && (
          <div className={classNames(icon, getIconSize(size))} aria-hidden="true" />
        )}
      </button>
    );
  },
);

function getVariantClasses(variant: ButtonVariant, active: boolean, disabled: boolean): string {
  if (disabled) {
    return 'bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text';
  }

  if (active) {
    switch (variant) {
      case 'primary': {
        return 'bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text';
      }
      case 'secondary': {
        return 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent';
      }
      case 'ghost': {
        return 'bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentActive';
      }
      case 'danger': {
        return 'bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text';
      }
      default: {
        return '';
      }
    }
  }

  switch (variant) {
    case 'primary': {
      return 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover';
    }
    case 'secondary': {
      return 'bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text hover:bg-bolt-elements-button-secondary-backgroundHover';
    }
    case 'ghost': {
      return 'bg-transparent text-bolt-elements-item-contentDefault hover:bg-bolt-elements-item-backgroundActive hover:text-bolt-elements-item-contentActive';
    }
    case 'danger': {
      return 'bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover';
    }
    default: {
      return '';
    }
  }
}

function getSizeClasses(size: ButtonSize, isIconOnly: boolean): string {
  if (isIconOnly) {
    switch (size) {
      case 'sm': {
        return 'p-1';
      }
      case 'md': {
        return 'p-1.5';
      }
      case 'lg': {
        return 'p-2';
      }
      default: {
        return '';
      }
    }
  }

  switch (size) {
    case 'sm': {
      return 'px-2.5 py-1.5 text-sm';
    }
    case 'md': {
      return 'px-4 py-2 text-base';
    }
    case 'lg': {
      return 'px-6 py-3 text-lg';
    }
    default: {
      return '';
    }
  }
}

function getIconSize(size: ButtonSize): string {
  switch (size) {
    case 'sm': {
      return 'text-sm';
    }
    case 'md': {
      return 'text-lg';
    }
    case 'lg': {
      return 'text-xl';
    }
    default: {
      return '';
    }
  }
}
