import { cn } from '@/lib/utils';
import { Platform, TextInput, View, Pressable, type TextInputProps } from 'react-native';
import * as React from 'react';

export interface InputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

function Input({
  className,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: InputProps & React.RefAttributes<TextInput>) {
  const inputRef = React.useRef<TextInput>(null);

  const baseInputClass = cn(
    'flex-1 font-sans text-sm text-foreground',
    Platform.select({
      web: cn(
        'outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground md:text-sm'
      ),
      native: 'placeholder:text-muted-foreground/50',
    })
  );

  const containerClass = cn(
    'flex h-12 w-full flex-row items-center rounded-full border border-input bg-background px-4 shadow-sm shadow-black/5',
    props.editable === false &&
      cn(
        'opacity-50',
        Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
      ),
    Platform.select({
      web: cn(
        'transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
      ),
    }),
    className
  );

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={{ width: '100%' }}>
      <View className={containerClass}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          ref={inputRef}
          className={baseInputClass}
          placeholderTextColor="hsl(0 0% 45%)"
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} className="ml-3 p-1">
            {rightIcon}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export { Input };
