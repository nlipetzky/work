/**
 * Canon Engine — Events module.
 *
 * Persistent audit log for all engine operations,
 * plus real-time change subscriptions (L2).
 */

export {
  createEventEmitter,
  queryEvents,
} from './event-emitter.js';

export type {
  EventType,
  SourceType,
  CanonEvent,
  EmittedEvent,
  CanonEventEmitter,
  ScopedEmitter,
  EventQuery,
} from './event-emitter.js';

export {
  subscribeToChanges,
  subscribeToCorrelation,
} from './change-subscription.js';

export type {
  ChangeSubscriptionOptions,
  ChangeSubscription,
} from './change-subscription.js';
