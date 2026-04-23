import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Eye 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSecurity } from '@/components/security/SecurityProvider';
import { toast } from 'sonner';

interface DataTableActionsProps<T> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  dispatch?: any;
  onView?: (item: T) => void;
  deleteConfirmMsg?: string;
}

export function DataTableActions<T extends { id: string }>({
  item,
  onEdit,
  onDelete,
  dispatch,
  onView,
  deleteConfirmMsg = 'Are you sure you want to delete this record?',
}: DataTableActionsProps<T>) {
  const { user } = useSecurity();

  const handleDelete = () => {
    if (window.confirm(deleteConfirmMsg)) {
      onDelete(item.id);
      toast.success('Record deleted successfully.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onView && (
          <DropdownMenuItem onClick={() => onView(item)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={() => onEdit(item)}
          className="text-blue-600 focus:text-blue-600"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {(user?.role === 'admin' || user?.role === 'qc_manager') && (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

