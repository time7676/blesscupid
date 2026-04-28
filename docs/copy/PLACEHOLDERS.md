# Onboarding Copy — Pastor Contract

All user-facing strings on the onboarding flow listed below MUST be authored or signed off
by the Pastor before BLE-7 ships. The engineering team uses placeholder copy with the same
key set so the layout, character budgets, and i18n string ids are stable.

**Hard rule (AGENTS.md):** UX copy that touches faith, relationships, or moderation must be
reviewed by the Pastor before shipping. Engineering does not author this copy.

## Contract

For each key:
- `id`: stable string id used in mobile app + i18n.
- `purpose`: where it appears.
- `budget`: max characters (mobile-friendly).
- `tone`: required tone signal.
- `placeholder`: current value (engineering stub — must be replaced).

| id | purpose | budget | tone | placeholder |
|---|---|---|---|---|
| `covenant.title` | Covenant screen header | 60 | Reverent, warm | "Our Holy Code of Conduct" |
| `covenant.body` | Covenant body, scrollable | 1500 | Pastoral, scriptural | "[PASTOR_COPY_REQUIRED] Body of the Holy Code of Conduct: marriage-minded intent, no sexual content, no harassment, mutual respect." |
| `covenant.acceptCta` | Accept button | 30 | Resolute | "I covenant before God" |
| `covenant.declineCta` | Back/leave | 24 | Gracious | "Not ready yet" |
| `ageGate.title` | DOB screen header | 50 | Plain | "When were you born?" |
| `ageGate.body` | Subtext explaining 18+ | 200 | Plain, non-condescending | "BlessCupid is for adults seeking marriage. We require you to be 18+." |
| `ageGate.errorUnderage` | Underage rejection | 200 | Gracious | "BlessCupid is for those 18 and older. We're glad you came — please return when you can." |
| `faith.denomination.title` | Question header | 60 | Plain | "Which tradition do you belong to?" |
| `faith.denomination.options.catholic` | Option label | 30 | Plain | "Catholic" |
| `faith.denomination.options.protestant` | Option label | 30 | Plain | "Protestant" |
| `faith.denomination.options.orthodox` | Option label | 30 | Plain | "Orthodox" |
| `faith.denomination.options.other` | Option label | 30 | Plain | "Other Christian" |
| `faith.attendance.title` | Question header | 60 | Plain | "How often do you attend church?" |
| `faith.attendance.options.weekly` | Option | 30 | Plain | "Weekly" |
| `faith.attendance.options.monthly` | Option | 30 | Plain | "Monthly" |
| `faith.attendance.options.occasional` | Option | 30 | Plain | "Occasionally" |
| `faith.attendance.options.rarely` | Option | 30 | Plain | "Rarely" |
| `faith.baptized.title` | Y/N question | 60 | Plain | "Have you been baptized?" |
| `faith.marriageIntent.title` | Question header | 80 | Plain | "What's your timeline for marriage?" |
| `faith.marriageIntent.options.within_1y` | Option | 40 | Plain | "Within a year" |
| `faith.marriageIntent.options.within_2y` | Option | 40 | Plain | "Within two years" |
| `faith.marriageIntent.options.within_5y` | Option | 40 | Plain | "Within five years" |
| `faith.marriageIntent.options.open_timeline` | Option | 40 | Plain | "Open timeline" |
| `faith.spiritualGifts.title` | Optional question | 80 | Encouraging | "What spiritual gifts do you sense in your life?" |
| `faith.spiritualGifts.helper` | Subtext | 120 | Pastoral | "Optional. Pick up to three." |
| `profile.basics.title` | Profile basics screen header | 60 | Plain | "Tell us about yourself" |
| `profile.bio.title` | Bio screen header | 60 | Plain | "Share a few words about you" |
| `profile.bio.helper` | Bio guidance | 200 | Pastoral, anti-suggestive | "What do you love about your faith? What are you praying for?" |
| `photo.requirements.title` | Photo upload screen header | 60 | Plain | "Add a clear face photo" |
| `photo.requirements.body` | Body explaining the rule | 240 | Gracious | "We require a clear photo of your face so others can connect with the real you. Please avoid body-only photos." |
| `photo.rejection.no_face_detected` | Error | 200 | Gracious | "We couldn't see a face in your photo. Please try a photo where your face is clearly visible." |
| `photo.rejection.face_too_small` | Error | 200 | Gracious | "Your face appears small in this photo. Please try a closer photo where your face is clearly visible." |
| `photo.rejection.multiple_faces` | Error | 200 | Gracious | "We saw more than one person. Please upload a photo of just you." |
| `photo.rejection.low_confidence` | Error | 200 | Gracious | "We couldn't get a clear read on the photo. Please try another." |
| `photo.rejection.unsafe` | Error (block) | 200 | Firm but gracious | "This photo doesn't meet our community standards. Please review the Holy Code of Conduct and try another." |
| `bio.rejection.block` | Bio blocked | 200 | Firm but gracious | "This bio doesn't meet our community standards. Please review the Holy Code of Conduct and try again." |
| `bio.rejection.review` | Bio held for review | 200 | Patient | "Thank you. Our team is reviewing your bio. You'll be notified shortly." |

## Engineering checklist for the Pastor handoff

- [ ] Pastor reviews each key, edits or replaces placeholder text.
- [ ] Engineering loads final copy into `apps/mobile/src/i18n/en.json` (or equivalent).
- [ ] Bio/photo rejection error keys remain stable so the API can return reason codes and
      the mobile client picks copy.
- [ ] Final covenant version string updated in `packages/shared/src/onboarding.ts`
      (`COVENANT_VERSION`) when Pastor signs the canonical covenant text. Each version
      change requires re-acceptance from existing users.
- [ ] No copy that frames the product as "hookup", "casual", or romantic-secular ships.

## Out-of-scope

Localization beyond English is **not** in BLE-7. Add `en` strings only; ICU/i18n
pipeline is a separate ticket.
