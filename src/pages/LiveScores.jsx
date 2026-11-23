import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import { useLiveFixtures } from "../hooks/football";
import SectionHeader from "../components/football/SectionHeader";
import MatchList from "../components/football/MatchList";
import { MatchListSkeleton } from "../components/football/Skeleton";
import EmptyState from "../components/football/EmptyState";
import { RiLiveLine } from "react-icons/ri";
import { useSEO } from "../utils/seo";

const LiveScores = () => {
  const { t, i18n } = useTranslation();
  useSEO({
    title: "Scores en direct — Football Autopsie",
    description: "Scores football en direct, matchs en cours et résultats en temps réel sur Football Autopsie.",
    path: "/scores",
  });
  const { data: live = [], isLoading, dataUpdatedAt } = useLiveFixtures();

  return (
    <Container>
      <div className="py-8">
        <SectionHeader level={1}
          title={t("Scores en direct")}
          subtitle={
            live.length
              ? t("{{count}} matchs en cours — mise à jour automatique toutes les 30s", {
                  count: live.length,
                })
              : t("Matchs en cours en temps réel")
          }
          action={
            live.length ? (
              <span className="flex items-center gap-2 text-red-500 text-xs font-black uppercase tracking-widest">
                <RiLiveLine className="animate-pulse text-base" /> Live
              </span>
            ) : null
          }
        />

        {isLoading ? (
          <MatchListSkeleton rows={6} />
        ) : live.length ? (
          <MatchList fixtures={live} showLeague />
        ) : (
          <EmptyState
            title={t("Aucun match en direct")}
            message={t("Il n'y a aucun match en cours actuellement. Les scores en direct apparaîtront ici dès qu'un match commencera.")}
          />
        )}

        {dataUpdatedAt > 0 && (
          <p className="text-center text-gray-600 text-xs mt-6">
            {t("Dernière mise à jour :")}{" "}
            {new Date(dataUpdatedAt).toLocaleTimeString(
              i18n.language?.startsWith("en") ? "en-GB" : "fr-FR"
            )}
          </p>
        )}
      </div>
    </Container>
  );
};

export default LiveScores;
