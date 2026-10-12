import userEvent from '@testing-library/user-event';

import {
  fireEvent, initializeMocks, render, screen, waitFor,
} from '@src/testUtils';
import { getCourseScheduleUrl, getTimezonesUrl } from './data/api';
import CourseScheduleStatusItem from './CourseScheduleStatusItem';
import {
  apiPayload, courseId, scheduleOf, sectionOf, timezoneNames,
} from './testData';

let axiosMock;

const renderItem = (isSelfPaced = false) => render(
  <CourseScheduleStatusItem courseId={courseId} isSelfPaced={isSelfPaced} />,
  { path: '/course/:courseId', params: { courseId } },
);

const openEditor = async () => {
  await userEvent.click(await screen.findByRole('button', { name: /scheduled|Set up schedule/ }));
  return screen.findByRole('dialog');
};

const savedBody = () => JSON.parse(axiosMock.history.put[0].data);

describe('<CourseScheduleStatusItem /> and the full schedule editor', () => {
  beforeEach(() => {
    axiosMock = initializeMocks().axiosMock;
    axiosMock.onGet(getTimezonesUrl()).reply(200, { timezones: timezoneNames });
  });

  it('shows how many sections are scheduled as one link', async () => {
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([sectionOf(1, scheduleOf()), sectionOf(2)]));
    renderItem();
    expect(await screen.findByRole('button', { name: '1/2 scheduled' })).toBeInTheDocument();
  });

  it.each([
    ['Set up schedule', 0],
    ['All 2 scheduled', 2],
  ])('labels the link "%s" when %i of 2 sections are scheduled', async (label, scheduled) => {
    const sections = [sectionOf(1, scheduled ? scheduleOf() : null), sectionOf(2, scheduled ? scheduleOf() : null)];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderItem();
    expect(await screen.findByRole('button', { name: label })).toBeInTheDocument();
  });

  it('explains that self-paced courses have no schedule', async () => {
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([sectionOf(1)], { selfPaced: true }));
    renderItem(true);
    expect(await screen.findByText('Available for instructor-paced courses')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when the feature is off', async () => {
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([], { enabled: false }));
    renderItem();
    await waitFor(() => expect(axiosMock.history.get.length).toBeGreaterThan(0));
    expect(screen.queryByText('Course schedule')).not.toBeInTheDocument();
  });

  it('auto-fills every section and saves the timezone', async () => {
    const sections = [sectionOf(1), sectionOf(2), sectionOf(3)];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    axiosMock.onPut(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderItem();
    await openEditor();

    await screen.findByRole('option', { name: 'Asia/Kathmandu' }); // the list loads separately
    fireEvent.change(screen.getByLabelText('Course timezone'), { target: { value: 'Asia/Kathmandu' } });
    const [fillDate] = screen.getAllByLabelText('Start date');
    fireEvent.change(fillDate, { target: { value: '2026-10-12' } });
    fireEvent.change(screen.getByLabelText('Number of days – Lesson 2'), { target: { value: '2' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apply to all sections' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    const body = savedBody();
    expect(body.timezone).toBe('Asia/Kathmandu');
    expect(body.upsert.map((item) => [item.start_date, item.num_days])).toEqual([
      ['2026-10-12', 1], ['2026-10-13', 2], ['2026-10-15', 1],
    ]);
    expect(body.remove).toEqual([]);
  });

  it('moves later rows when a date changes, and removes cleared rows', async () => {
    const sections = [
      sectionOf(1, scheduleOf({ startDate: '2026-10-12', endDate: '2026-10-12' })),
      sectionOf(2, scheduleOf({ startDate: '2026-10-13', endDate: '2026-10-13' })),
      sectionOf(3, scheduleOf({ startDate: '2026-10-14', endDate: '2026-10-14' })),
    ];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    axiosMock.onPut(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderItem();
    await openEditor();

    fireEvent.change(screen.getByLabelText('Start date – Lesson 2'), { target: { value: '2026-10-16' } });
    expect(screen.getByLabelText('Start date – Lesson 3')).toHaveValue('Sat, 17 Oct');
    expect(screen.getByText('2 unsaved changes')).toBeInTheDocument(); // Lesson 2, and Lesson 3 moved with it
    await userEvent.click(screen.getByRole('button', { name: 'Clear the schedule of Lesson 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    const body = savedBody();
    expect(body.upsert.map((item) => item.start_date)).toEqual(['2026-10-16', '2026-10-17']);
    expect(body.remove).toEqual([sections[0].sectionId]);
    expect(body.timezone).toBeUndefined();
  });

  it('opens straight onto the rows, with no spinner, and starts clean each time', async () => {
    const sections = [sectionOf(1, scheduleOf({ startDate: '2026-10-12', endDate: '2026-10-12' }))];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderItem();

    const link = await screen.findByRole('button', { name: /scheduled/ });
    await userEvent.click(link);
    // The schedule is already cached, so the rows are there on the first render.
    expect(screen.queryByText('Loading schedule…')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Start date – Lesson 1')).toHaveValue('Mon, 12 Oct');

    fireEvent.change(screen.getByLabelText('Start date – Lesson 1'), { target: { value: '2026-10-20' } });
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopening shows the saved schedule again, not the abandoned edit, and no spinner in between.
    await userEvent.click(link);
    expect(screen.queryByText('Loading schedule…')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Start date – Lesson 1')).toHaveValue('Mon, 12 Oct');
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument();
  });

  it('keeps quick fill closed once sections are scheduled, until asked for', async () => {
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([sectionOf(1, scheduleOf()), sectionOf(2)]));
    renderItem();
    await openEditor();

    expect(screen.queryByRole('button', { name: 'Apply to all sections' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fill all sections…' }));
    expect(screen.getByRole('button', { name: 'Apply to all sections' })).toBeInTheDocument();
  });

  it('blocks saving invalid rows', async () => {
    const sections = [sectionOf(1, scheduleOf())];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderItem();
    await openEditor();

    fireEvent.change(screen.getByLabelText('End time – Lesson 1'), { target: { value: '19:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));
    expect(screen.getByText("End time can't be the same as the start time.")).toBeInTheDocument();
    expect(axiosMock.history.put.length).toBe(0);
  });
});
