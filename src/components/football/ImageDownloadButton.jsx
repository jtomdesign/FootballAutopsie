import React from "react";
import { RiDownload2Line } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { downloadTableAsImage } from "../../utils/downloadTableImage";

const ImageDownloadButton = ({
  getNode,
  filename = "export",
  iconOnly = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const [busy, setBusy] = React.useState(false);

  const handleClick = async () => {
    const node = getNode?.();
    if (!node || busy) return;
    setBusy(true);
    try {
      await downloadTableAsImage(node, filename);
    } catch (err) {
      console.error("Image export failed:", err);
      toast.error(t("Impossible de générer l'image"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      data-export-ignore
      onClick={handleClick}
      disabled={busy}
      title={t("Télécharger en image")}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 ${className}`}
    >
      <RiDownload2Line className={busy ? "animate-spin" : ""} />
      {!iconOnly && (busy ? "..." : "Image")}
    </button>
  );
};

export default ImageDownloadButton;
