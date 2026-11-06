import { tv } from 'tailwind-variants';

export const style = tv({
  slots: {
    wrapper: 'absolute invisible z-50',
    overlay: 'fixed inset-0 overflow-y-auto bg-neutral/30 invisible',
    close: 'absolute top-0 right-0 p-md text-neutral-strong cursor-pointer',
    title: 'text-xl font-secondary font-semibold mb-md pr-lg',
    box: [
      'relative mx-auto my-4 sm:my-10', // positioning
      'p-md w-[90%] max-w-[90%]', // size
      'bg-background rounded-lg opacity-0', // styling
      'transition-all', //animation
    ],
  },
  variants: {
    opened: {
      true: {
        wrapper: 'visible',
        overlay: 'visible',
        box: 'opacity-100',
      },
    },
    small: {
      true: {
        box: 'max-w-[480px]',
      },
    },
  },
});
