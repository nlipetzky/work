# Surface Sketch: /build console

(Move 2 artifact. Low-fidelity breadboard. Drafted by the build agent, awaiting operator reaction.)

```
SURFACE SKETCH
Operator: the operator (starts builds, acts on asks). The build agent reads and updates it too.

Places (views on the /build tab):

  - BUILDS IN FLIGHT  (the main table, the thing you watch)
      Shows: one row per system being built:
               name | current move (1 Brief / 2 Sketch / 3 Slice / 4 Grow) | status
               | the ONE pending ask | links to its brief + sketch
      Does:  act on the pending ask right here:
               Ratify brief | React to sketch | Trust slice | Confirm capability
               (acting advances the build to the next move). Open the brief or sketch.
      Asks land here: brief-awaiting-ratification, sketch-awaiting-reaction,
               slice-awaiting-trust, capability-awaiting-confirm.
               This is THE home for every human-in-the-loop ask from every build.

  - START A BUILD  (top of the tab)
      Shows: a box for your two-line ask ("build a system that does Y; I need to see Z").
      Does:  submit, which creates a new build in move 1; the build agent then drafts the brief.

  - DONE  (collapsed by default)
      Shows: builds that reached done, each with its registered canon systems row.
      Does:  open the finished system's anatomy on /system.
```

First slice renders only BUILDS IN FLIGHT over real seeded rows, with one working action.
START A BUILD and DONE come in Move 4 (grow).
