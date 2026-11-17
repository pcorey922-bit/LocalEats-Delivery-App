-- Preserve every existing device as the original customer app. No financial or
-- order records are touched. Distinct apps must not share an APNs topic.
ALTER TABLE notification_devices ADD COLUMN app_id varchar(100) NOT NULL DEFAULT 'com.rocoeats.app';
ALTER TABLE notification_devices ADD CONSTRAINT notification_device_app_id_allowed
CHECK (app_id IN ('com.rocoeats.app', 'com.rocoeats.app.staging', 'com.rocoeats.driver', 'com.rocoeats.driver.staging'));
