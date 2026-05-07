/**
 * BullMQ queue names for the photos module. Centralized so processors,
 * service, and module wiring all reference the same string constants.
 */

export const IMAGE_VARIANTS_QUEUE = 'image-variants';
export const PHOTO_MODERATION_RETRY_QUEUE = 'photo-moderation-retry';
