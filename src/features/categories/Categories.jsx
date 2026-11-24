import React, { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../../hooks/useCategories";
import { slugify } from "../../utils/helpers";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import ConfirmDelete from "../../ui/ConfirmDelete";
import Spinner from "../../ui/Spinner";
import EmptyState from "../../components/football/EmptyState";
import {
  LuPlus,
  LuTrash2,
  LuPencil,
} from "react-icons/lu";

const PRESET_COLORS = [
  "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

const inputCls =
  "w-full border border-emerald-900/40 focus:ring-emerald-400 focus:ring-1 focus:outline-none py-2.5 px-4 rounded-xl text-sm text-gray-100 bg-emerald-900/40 placeholder:text-gray-500";

const CategoryForm = ({ category = null, onCloseModal }) => {
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const isEdit = Boolean(category?.id);
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? PRESET_COLORS[0]);
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const handleName = v => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const submit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name: name.trim(), slug: slugify(slug || name), color };
    const onSuccess = () => onCloseModal?.();
    if (isEdit) {
      updateCategory({ id: category.id, ...payload }, { onSuccess });
    } else {
      createCategory(payload, { onSuccess });
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 w-80">
      <h3 className="font-bold text-gray-100 text-lg">
        {isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
      </h3>
      <FormRow label="Nom">
        <input
          className={inputCls}
          value={name}
          onChange={e => handleName(e.target.value)}
          placeholder="Ex : Transferts"
          required
        />
      </FormRow>
      <FormRow label="Slug">
        <input
          className={inputCls}
          value={slug}
          onChange={e => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
      </FormRow>
      <FormRow label="Couleur">
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? "border-emerald-400 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-emerald-900/40 bg-transparent"
          />
        </div>
      </FormRow>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="secondary" role="button" name="Annuler" onClick={onCloseModal} />
        <Button
          name={isEdit ? "Mettre à jour" : "Créer"}
          role="submit"
        />
      </div>
    </form>
  );
};

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const { mutate: deleteCategory, isPending: deleting } = useDeleteCategory();

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-100">Catégories</h1>
          <p className="text-sm text-gray-400 mt-1">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""}
          </p>
        </div>
        <Modal>
          <Modal.Open opens="create">
            <Button type="primary" name="Nouvelle catégorie" icon={<LuPlus />} />
          </Modal.Open>
          <Modal.Window name="create">
            <CategoryForm />
          </Modal.Window>
        </Modal>
      </div>

      {categories.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-emerald-950/60 rounded-2xl p-4"
            >
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: c.color || "#10b981" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-100 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">/{c.slug}</p>
              </div>
              <Modal>
                <Modal.Open opens="edit">
                  <button className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                    <LuPencil />
                  </button>
                </Modal.Open>
                <Modal.Window name="edit">
                  <CategoryForm category={c} />
                </Modal.Window>
              </Modal>
              <Modal>
                <Modal.Open opens="delete">
                  <button className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                    <LuTrash2 />
                  </button>
                </Modal.Open>
                <Modal.Window name="delete">
                  <ConfirmDelete
                    element={`la catégorie « ${c.name} »`}
                    isDeleting={deleting}
                    onConfirm={() => deleteCategory(c.id)}
                  />
                </Modal.Window>
              </Modal>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune catégorie"
          message="Créez vos premières catégories pour organiser les articles."
        />
      )}
    </div>
  );
};

export default Categories;
