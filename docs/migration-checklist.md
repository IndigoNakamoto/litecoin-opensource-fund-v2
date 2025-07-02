# Next.js v15 Migration Checklist: Donation Flow

This document outlines the components and APIs that need to be migrated from the Next.js v13 project to the new Next.js v15 project.

## Components

### Payment Flow
- [X] `components/PaymentForm.tsx`

### Payment Options
- [X] `components/PaymentModalCryptoOption.tsx`
- [X] `components/PaymentModalFiatOption.tsx`
- [X] `components/PaymentModalStockOption.tsx`

### Donation Steps
- [X] `components/PaymentModalPersonalInfo.tsx`
- [X] `components/PaymentModalCryptoDonate.tsx`
- [X] `components/PaymentModalFiatDonate.tsx`
- [X] `components/PaymentModalFiatThankYou.tsx`
- [X] `components/PaymentModalStockBrokerInfo.tsx`
- [X] `components/PaymentModalStockDonorSignature.tsx`
- [X] `components/PaymentModalStockDonorThankYou.tsx`

### Shared Components
- [X] `components/Button.tsx`
- [X] `components/GradientButton.tsx`
- [X] `components/ConversionRateCalculator.tsx`
- [X] `components/Notification.tsx`

## Hooks & Contexts
- [X] `contexts/DonationContext.tsx`
- [X] `next-auth/react` (ensure `useSession` is correctly configured)
  - [X] **1. Migrate NextAuth.js API Route**:
    - [X] Move the NextAuth configuration from `pages/api/auth/[...nextauth].ts` to `app/api/auth/[...nextauth]/route.ts`.
    - [X] Update the `route.ts` file to export named `GET` and `POST` handlers, as required by the App Router.
    - [ ] Verify the `jwt` and `session` callbacks are correctly implemented to pass the `username` from the Twitter profile to the client-side session object.
  - [ ] **2. Configure Session Provider for App Router**:
    - [ ] Ensure the `<SessionProvider>` is implemented within a dedicated Client Component (e.g., `app/providers.tsx`).
    - [ ] Confirm this `Providers` component wraps the `{children}` in the root layout (`app/layout.tsx`) to make the session available globally.
  - [ ] **3. Update Component Usage**:
    - [ ] Add the `"use client";` directive to the top of all components that use the `useSession` hook, such as `DonationForm.tsx`.
    - [ ] Check that components are correctly accessing the session data (e.g., `session.user.username`).
    - [ ] Replace any usage of `signIn` and `signOut` from `next-auth/react` and ensure they function as expected.

## API Endpoints
- [X] `/api/getWidgetSnippet`
- [X] `/api/getCryptoRate`
- [X] `/api/getTickerList`
- [X] `/api/getTickerCost`
- [X] `/api/createFiatDonationPledge`
- [X] `/api/createDepositAddress`
- [X] `/api/createStockDonationPledge`
- [~] `/api/chargeFiatDonationPledge`
- [X] `/api/getBrokersList`
- [~] `/api/submitStockDonation`
- [~] `/api/signStockDonation`

## External Dependencies
- [ ] Shift4.js
- [ ] react-signature-canvas
