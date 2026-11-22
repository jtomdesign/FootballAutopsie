# Football Autopsie

Plateforme média et statistiques football en français : actualités, matchs en
direct, classements, équipes, joueurs et dashboard éditorial complet.

## Stack

- React 19 + Vite + Tailwind CSS v4
- React Query (data fetching, cache, auto-refresh des scores live)
- Redux Toolkit (session utilisateur)
- Supabase (articles, catégories, auth, storage)
- API-Football via RapidAPI (fixtures, live, standings, teams, players)
- Tiptap (éditeur riche d'articles)

## Configuration

```bash
cp .env.example .env
```

Renseignez dans `.env` :

- `VITE_FOOTBALL_API_KEY` — clé API-Football (https://rapidapi.com/api-sports/api/api-football)

Supabase est déjà configuré dans `src/services/supabase.js`.

## Base de données — migration requise

Exécutez `supabase/migrations/20261122000000_secure_editorial.sql` dans le SQL
Editor Supabase. Elle :

- ajoute la colonne `Posts.publishAt` (publications planifiées),
- crée `user_profiles` + `is_admin()` pour autoriser les éditeurs,
- remplace les policies RLS permissives (posts/catégories/storage).

Accordez ensuite le rôle admin à votre compte :

```sql
insert into public.user_profiles (id, role)
values ('<uuid-de-votre-user-supabase-auth>', 'admin')
on conflict (id) do update set role = 'admin';
```

## Scripts

```bash
npm run dev      # serveur de dev
npm run build    # build production
npm run lint     # eslint
npm run preview  # prévisualise le build
```

## Structure

- `src/pages/` — pages publiques (Home, News, Fixtures, MatchCenter,
  Ligues, LeagueDetail, Teams, TeamDetail, Players, PlayerDetail,
  LiveScores, Search) + `Account`, `Dashboard`
- `src/components/football/` — MatchRow, MatchList, LeagueTable, Skeleton,
  EmptyState, SectionHeader, TeamLogo
- `src/components/editor/RichTextEditor.jsx` — éditeur Tiptap complet
- `src/services/football/` — client API-Football, normaliseurs, endpoints
- `src/services/apiPosts.js` — articles/catégories Supabase + storage
- `src/hooks/football.js` — hooks React Query pour les données football
- `src/features/posts/ArticleEditor.jsx` — éditeur d'article admin

## Notes

- Les données football proviennent d'API-Football (plan gratuit ≈ 100 req/jour).
  Les écrans affichent des états vides quand la donnée n'est pas disponible.
- Les matchs en direct se rafraîchissent automatiquement toutes les 30 s.
# FootballAutopsie
