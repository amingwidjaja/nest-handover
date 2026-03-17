flowchart LR

handover --> handover_items
handover --> receive_event

receive_event --> status_update
status_update --> handover