-- Enable logical replication publication for PowerSync
-- This runs on first DB initialization only

CREATE PUBLICATION powersync FOR TABLE "Category", "Question", "AppState";
