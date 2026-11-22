import React from "react";
import Button from "./Button";

const ConfirmDelete = ({
  element = "cet élément",
  onConfirm,
  onCloseModal,
  isDeleting,
}) => {
  return (
    <div className="px-3 flex flex-col items-center">
      <h3 className="my-8 font-semibold text-md text-gray-100">
        Vous êtes sur le point de supprimer {element}.
      </h3>
      <div className="flex gap-2 items-center justify-center">
        <Button name="Annuler" onClick={onCloseModal} type="secondary" />

        <Button
          name={isDeleting ? "Suppression…" : "Supprimer"}
          onClick={onConfirm}
          type="danger"
        />
      </div>
    </div>
  );
};

export default ConfirmDelete;
