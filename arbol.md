.
├── AGENTS.md
├── CLAUDE.md
├── Dockerfile
├── Dockerfile.dev
├── README.md
├── arbol.md
├── bun.lock
├── components.json
├── docker-compose.yml
├── drizzle.config.ts
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── public
│   ├── a2gnrl.svg
│   ├── ados-icon.svg
│   ├── apple-touch-icon.png
│   ├── fonts
│   │   ├── ClashGrotesk-Bold.eot
│   │   ├── ClashGrotesk-Bold.ttf
│   │   ├── ClashGrotesk-Bold.woff
│   │   ├── ClashGrotesk-Bold.woff2
│   │   ├── ClashGrotesk-Extralight.eot
│   │   ├── ClashGrotesk-Extralight.ttf
│   │   ├── ClashGrotesk-Extralight.woff
│   │   ├── ClashGrotesk-Extralight.woff2
│   │   ├── ClashGrotesk-Light.eot
│   │   ├── ClashGrotesk-Light.ttf
│   │   ├── ClashGrotesk-Light.woff
│   │   ├── ClashGrotesk-Light.woff2
│   │   ├── ClashGrotesk-Medium.eot
│   │   ├── ClashGrotesk-Medium.ttf
│   │   ├── ClashGrotesk-Medium.woff
│   │   ├── ClashGrotesk-Medium.woff2
│   │   ├── ClashGrotesk-Regular.eot
│   │   ├── ClashGrotesk-Regular.ttf
│   │   ├── ClashGrotesk-Regular.woff
│   │   ├── ClashGrotesk-Regular.woff2
│   │   ├── ClashGrotesk-Semibold.eot
│   │   ├── ClashGrotesk-Semibold.ttf
│   │   ├── ClashGrotesk-Semibold.woff
│   │   ├── ClashGrotesk-Semibold.woff2
│   │   ├── ClashGrotesk-Variable.eot
│   │   ├── ClashGrotesk-Variable.ttf
│   │   ├── ClashGrotesk-Variable.woff
│   │   └── ClashGrotesk-Variable.woff2
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo.png
│   └── manifest.webmanifest
├── scripts
│   ├── list-all.ts
│   ├── migrate-data.ts
│   └── send-birthday-notifications.ts
├── src
│   ├── app
│   │   ├── activities
│   │   │   ├── [id]
│   │   │   │   ├── edit
│   │   │   │   │   ├── [tab]
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── tabs
│   │   │   │   │       ├── TabAsistencia.tsx
│   │   │   │   │       ├── TabDeportes.tsx
│   │   │   │   │       ├── TabEquipos.tsx
│   │   │   │   │       ├── TabExtras.tsx
│   │   │   │   │       ├── TabGoles.tsx
│   │   │   │   │       ├── TabInfo.tsx
│   │   │   │   │       ├── TabInvitados.tsx
│   │   │   │   │       └── TabJuegos.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── view
│   │   │   │       ├── [tab]
│   │   │   │       │   └── page.tsx
│   │   │   │       └── tabs
│   │   │   │           ├── TabAsistencia.jsx
│   │   │   │           ├── TabEquipos.jsx
│   │   │   │           ├── TabGoleadores.jsx
│   │   │   │           ├── TabPartidos.jsx
│   │   │   │           └── TabRanking.jsx
│   │   │   ├── new
│   │   │   │   ├── [tab]
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── api
│   │   │   ├── activities
│   │   │   │   └── route.ts
│   │   │   ├── health
│   │   │   │   └── route.ts
│   │   │   ├── images
│   │   │   │   └── [id]
│   │   │   ├── live
│   │   │   │   └── route.ts
│   │   │   ├── login
│   │   │   │   └── route.ts
│   │   │   ├── notifications
│   │   │   │   └── route.ts
│   │   │   ├── participants
│   │   │   │   └── route.ts
│   │   │   ├── push-config
│   │   │   │   └── route.ts
│   │   │   ├── push-subscribe
│   │   │   │   └── route.ts
│   │   │   ├── rankings
│   │   │   │   └── route.ts
│   │   │   └── subscriptions
│   │   │       └── route.ts
│   │   ├── calendar
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── participants
│   │       ├── [id]
│   │       │   ├── edit
│   │       │   │   └── page.tsx
│   │       │   └── page.tsx
│   │       ├── new
│   │       │   └── page.tsx
│   │       └── page.tsx
│   ├── components
│   │   ├── auth
│   │   │   ├── AuthGate.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── pages
│   │   │   ├── ActivityPage.tsx
│   │   │   ├── BirthdayCalendarPage.tsx
│   │   │   └── ParticipantsPage.tsx
│   │   ├── participants
│   │   │   ├── ParticipantForm.tsx
│   │   │   └── PlayerDetail.tsx
│   │   └── ui
│   │       ├── Avatar.jsx
│   │       ├── Badges.tsx
│   │       ├── BottomNav.tsx
│   │       ├── Common.tsx
│   │       ├── FloatingNav.tsx
│   │       ├── HelpInfo.jsx
│   │       ├── ImageCropModal.jsx
│   │       ├── ImageExpandModal.jsx
│   │       ├── NotificationsModal.tsx
│   │       ├── PWAInstall.tsx
│   │       ├── SavingOverlay.tsx
│   │       ├── TeamTable.jsx
│   │       ├── alert-dialog.tsx
│   │       ├── badge.tsx
│   │       ├── button-group.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── combobox.tsx
│   │       ├── command.tsx
│   │       ├── dialog.tsx
│   │       ├── input-group.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── radio-group.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── tooltip.tsx
│   ├── hooks
│   │   ├── use-mobile.ts
│   │   ├── use-toast.ts
│   │   ├── useApp.ts
│   │   ├── useAuth.ts
│   │   ├── useDatabase.ts
│   │   └── usePolling.ts
│   ├── lib
│   │   ├── cache.ts
│   │   ├── calc.ts
│   │   ├── confirm.jsx
│   │   ├── constants.ts
│   │   ├── db-utils.ts
│   │   ├── db.ts
│   │   ├── eventBus.ts
│   │   ├── imageUtils.js
│   │   ├── migrate.ts
│   │   ├── minio.ts
│   │   ├── schema.ts
│   │   ├── store
│   │   ├── utils.js
│   │   ├── utils.ts
│   │   ├── web-push-client.ts
│   │   └── web-push-server.ts
│   ├── store
│   │   └── appStore.ts
│   └── types
│       └── global.d.ts
└── tsconfig.json

44 directories, 163 files
