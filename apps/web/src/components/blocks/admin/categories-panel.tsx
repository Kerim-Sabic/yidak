'use client';

import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminCategoriesPanelProps {
  title: string;
  subtitle: string;
}

interface CategoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  parentId: string | null;
}

const seedCategories: ReadonlyArray<CategoryItem> = [
  {
    id: 'c1',
    nameEn: 'Plumbing',
    nameAr: '?????',
    icon: 'Droplets',
    sortOrder: 1,
    active: true,
    parentId: null,
  },
  {
    id: 'c2',
    nameEn: 'Electrical',
    nameAr: '??????',
    icon: 'Zap',
    sortOrder: 2,
    active: true,
    parentId: null,
  },
  {
    id: 'c3',
    nameEn: 'AC / HVAC',
    nameAr: '?????',
    icon: 'Snowflake',
    sortOrder: 3,
    active: true,
    parentId: null,
  },
  {
    id: 'c4',
    nameEn: 'Leak Detection',
    nameAr: '??? ????',
    icon: 'Search',
    sortOrder: 4,
    active: true,
    parentId: 'c1',
  },
];

const toSorted = (items: ReadonlyArray<CategoryItem>): ReadonlyArray<CategoryItem> =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

export const AdminCategoriesPanel = ({
  title,
  subtitle,
}: AdminCategoriesPanelProps): React.JSX.Element => {
  const [categories, setCategories] = useState<ReadonlyArray<CategoryItem>>(
    toSorted(seedCategories),
  );
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [icon, setIcon] = useState('Wrench');
  const [parentId, setParentId] = useState('root');

  const move = (id: string, direction: -1 | 1): void => {
    setCategories((current) => {
      const list = [...current].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = list.findIndex((item) => item.id === id);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= list.length) {
        return current;
      }

      const source = list[index];
      const destination = list[target];
      if (!source || !destination) {
        return current;
      }

      const next = list.map((item) => {
        if (item.id === source.id) {
          return { ...item, sortOrder: destination.sortOrder };
        }

        if (item.id === destination.id) {
          return { ...item, sortOrder: source.sortOrder };
        }

        return item;
      });

      return toSorted(next);
    });
  };

  const createCategory = (): void => {
    if (nameEn.trim().length < 2 || nameAr.trim().length < 2) {
      return;
    }

    setCategories((current) => {
      const maxOrder = current.reduce((highest, item) => Math.max(highest, item.sortOrder), 0);
      return [
        ...current,
        {
          id: `c${current.length + 1}`,
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
          icon,
          sortOrder: maxOrder + 1,
          active: true,
          parentId: parentId === 'root' ? null : parentId,
        },
      ];
    });

    setNameEn('');
    setNameAr('');
    setIcon('Wrench');
    setParentId('root');
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {toSorted(categories).map((category) => (
              <div
                key={category.id}
                className="border-border flex items-center justify-between rounded-xl border p-3"
              >
                <div>
                  <p className="font-medium">{category.nameEn}</p>
                  <p className="text-muted-foreground text-xs">
                    {category.nameAr} · {category.icon}
                  </p>
                  {category.parentId ? (
                    <p className="text-muted-foreground text-xs">Subcategory</p>
                  ) : null}
                </div>
                <div className="inline-flex items-center gap-2">
                  <Badge variant={category.active ? 'default' : 'secondary'}>
                    {category.active ? 'Active' : 'Hidden'}
                  </Badge>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      move(category.id, -1);
                    }}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      move(category.id, 1);
                    }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create / Edit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input
                id="nameEn"
                value={nameEn}
                onChange={(event) => {
                  setNameEn(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nameAr">Name (Arabic)</Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(event) => {
                  setNameAr(event.target.value);
                }}
                dir="rtl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(event) => {
                  setIcon(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="parent">Parent category</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No parent</SelectItem>
                  {categories
                    .filter((item) => item.parentId === null)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nameEn}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="w-full" onClick={createCategory}>
              <Plus className="h-4 w-4" />
              Save Category
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminCategoriesPanel;
