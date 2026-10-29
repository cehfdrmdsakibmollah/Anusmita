import {describe,it,expect} from 'vitest';
import {dashboardWindow,fillDailySeries,chartGeometry} from './dashboard-metrics';
describe('dashboard date and chart semantics',()=>{
 it('uses Dhaka midnight across a UTC date and year boundary',()=>{
  const w=dashboardWindow(new Date('2026-12-31T18:15:00Z'),7);
  expect(w.today.toISOString()).toBe('2026-12-31T18:00:00.000Z');
  expect(w.start.toISOString()).toBe('2026-12-25T18:00:00.000Z');
  expect(fillDailySeries(w.start,7,[],[]).at(-1)?.date).toBe('2027-01-01');
 });
 it('zero-fills missing dates without dropping negative refunds',()=>{
  const {start}=dashboardWindow(new Date('2026-10-28T12:00:00Z'),7);
  const rows=fillDailySeries(start,7,[{_id:'2026-10-28',total:10000}],[{_id:'2026-10-27',total:-2500}]);
  expect(rows).toHaveLength(7);expect(rows[0].orderedPaisa).toBe(0);
  expect(rows.at(-2)?.collectedPaisa).toBe(-2500);expect(rows.at(-1)?.orderedPaisa).toBe(10000);
 });
 it('keeps refund days and all-zero data inside the chart bounds',()=>{
  const {y}=chartGeometry([{date:'2026-10-28',orderedPaisa:10000,collectedPaisa:-5000}]);
  expect(y(-5000)).toBe(151);expect(y(10000)).toBe(15);
  const empty=chartGeometry([]);expect(Number.isFinite(empty.y(0))).toBe(true);
 });
});
