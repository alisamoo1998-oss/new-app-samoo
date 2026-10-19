import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageGapDays, maintenanceStatus, maintenanceStatusPatch, pageRecords, recordYear } from './leaveRecords.js';

test('duty gaps use stored dates, including year boundaries', () => {
    assert.equal(averageGapDays(['2026-01-21', '2026-01-01', '2026-01-11']), 10);
    assert.equal(averageGapDays(['2025-12-31', '2026-01-02']), 2);
    assert.equal(averageGapDays(['2026-01-01']), null);
    assert.equal(recordYear('2026-10-19'), '2026');
});
test('completed maintenance is separate; existing unclassified records remain ongoing', () => {
    assert.equal(maintenanceStatus({ oilType: '5W30' }), 'ongoing');
    assert.equal(maintenanceStatus({ status: 'completed' }), 'completed');
});
test('archiving and restoring update status only, preserving all maintenance data', () => {
    const original = { date: '2026-10-19', maintenanceType: 'فرامل', oilType: '5W30', odometer: 50000 };
    const archived = { ...original, ...maintenanceStatusPatch(true, '2026-10-19T00:00:00Z') };
    assert.equal(archived.status, 'completed');
    assert.equal(archived.completedAt, '2026-10-19T00:00:00Z');
    const restored = { ...archived, ...maintenanceStatusPatch(false) };
    assert.equal(restored.status, 'ongoing');
    assert.equal(restored.completedAt, null);
    for (const key of Object.keys(original)) assert.equal(restored[key], original[key]);
});
test('pagination limits long records without losing entries', () => {
    const records = Array.from({length: 25}, (_, i) => i);
    assert.equal(pageRecords(records, 1).rows.length, 12);
    assert.deepEqual(pageRecords(records, 3).rows, [24]);
    assert.equal(pageRecords(records, 4).current, 3);
});