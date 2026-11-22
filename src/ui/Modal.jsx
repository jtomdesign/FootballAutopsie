import React, {
  cloneElement,
  createContext,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { RiCloseLargeLine } from "react-icons/ri";
import { useOutsideClick } from "../hooks/useOutsideClick";

const ModalContext = createContext();

const Modal = ({ children }) => {
  const [openName, setOpenName] = useState("");
  const close = () => setOpenName("");
  const open = setOpenName;
  return (
    <ModalContext.Provider value={{ openName, close, open }}>
      {children}
    </ModalContext.Provider>
  );
};

function Open({ children, opens: openWindowName }) {
  const { open } = useContext(ModalContext);

  return cloneElement(children, { onClick: () => open(openWindowName) });
}
function Window({ children, name }) {
  const { openName, close } = useContext(ModalContext);
  const { ref } = useOutsideClick(close);
  if (name !== openName) return null;
  return createPortal(
    <div className="fixed top-0 left-0 w-full h-dvh z-1000 backdrop-blur-xs bg-gray-900/60">
      <div
        ref={ref}
        className="fa-modal fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-gray-100 rounded-2xl shadow-2xl transition-all duration-300 py-6 px-8 "
      >
        <button
          onClick={close}
          className="py-4  transition-all duration-300 cursor-pointer fixed right-4 top-4  text-gray-400 hover:text-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
        >
          <RiCloseLargeLine />
        </button>
        <div className="mt-9">
          {cloneElement(children, { onCloseModal: close })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;
