import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

export function ConfirmDialog ({ title, description, confirmLabel, onConfirm, trigger }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant='ghost' />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant='destructive' onClick={onConfirm} />}>{confirmLabel}</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
