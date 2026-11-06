import { FaIcon } from '@atomic/atm.fa-icon';
import * as Dialog from '@radix-ui/react-dialog';
import type * as React from 'react';
import { style } from './modal.component.style';

export interface ModalProps {
  small?: boolean;
  opened?: boolean;
  onClose?: () => void;
  title: string;
  hideTitle?: boolean;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = props => (
  <Dialog.Root
    open={props.opened}
    onOpenChange={open => {
      if (!open) {
        props.onClose?.();
      }
    }}>
    <Dialog.Portal>
      <div className={style().wrapper({ opened: props.opened })}>
        <Dialog.Overlay className={style().overlay({ opened: props.opened })}>
          <Dialog.Content className={style().box({ opened: props.opened, small: props.small })}>
            <Dialog.Close className={style().close()} aria-label="Fechar">
              <FaIcon.Close />
            </Dialog.Close>
            <Dialog.Title className={props.hideTitle ? 'sr-only' : style().title()}>{props.title}</Dialog.Title>
            {props.children}
          </Dialog.Content>
        </Dialog.Overlay>
      </div>
    </Dialog.Portal>
  </Dialog.Root>
);
