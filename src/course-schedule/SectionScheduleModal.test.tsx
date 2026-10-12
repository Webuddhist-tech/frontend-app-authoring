import userEvent from '@testing-library/user-event';

import {
  fireEvent, initializeMocks, render, screen, waitFor,
} from '@src/testUtils';
import { getCourseScheduleUrl } from './data/api';
import SectionScheduleModal from './SectionScheduleModal';
import {
  apiPayload, courseId, scheduleOf, sectionOf,
} from './testData';

let axiosMock;
let mockShowToast;
const onClose = jest.fn();

const renderModal = (sectionId: string, displayName: string) => render(
  <SectionScheduleModal courseId={courseId} sectionId={sectionId} displayName={displayName} isOpen onClose={onClose} />,
  { path: '/course/:courseId', params: { courseId } },
);

const savedBody = () => JSON.parse(axiosMock.history.put[0].data);

describe('<SectionScheduleModal />', () => {
  beforeEach(() => {
    const mocks = initializeMocks();
    axiosMock = mocks.axiosMock;
    mockShowToast = mocks.mockShowToast;
  });

  it('offers to schedule the remaining sections back to back the first time', async () => {
    const sections = [sectionOf(1), sectionOf(2), sectionOf(3)];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    axiosMock.onPut(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderModal(sections[0].sectionId, 'Lesson 1');

    fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: '2026-10-12' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '19:00' } });
    fireEvent.change(screen.getByLabelText('Instructor'), { target: { value: 'Geshe Tenzin' } });

    expect(screen.getByText('2 sections back to back, Tue, Oct 13 → Wed, Oct 14. Only the time is copied.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Schedule the remaining sections' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    const { upsert } = savedBody();
    expect(upsert.map((item) => [item.start_date, item.start_time, item.instructor])).toEqual([
      ['2026-10-12', '19:00', 'Geshe Tenzin'],
      ['2026-10-13', '19:00', ''],
      ['2026-10-14', '19:00', ''],
    ]);
    expect(mockShowToast).toHaveBeenCalledWith('Schedule saved for 3 sections');
    expect(onClose).toHaveBeenCalled();
  });

  it('moves later sections by the same number of days', async () => {
    const sections = [
      sectionOf(1, scheduleOf({ startDate: '2026-10-12', endDate: '2026-10-12' })),
      sectionOf(2, scheduleOf({ startDate: '2026-10-13', endDate: '2026-10-13' })),
      sectionOf(3, scheduleOf({ startDate: '2026-10-14', endDate: '2026-10-14' })),
    ];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    axiosMock.onPut(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderModal(sections[1].sectionId, 'Lesson 2');

    fireEvent.change(await screen.findByLabelText('Number of days'), { target: { value: '2' } });
    expect(screen.getByText('The section after this one move by +1 day. Lesson 3 → Thu, Oct 15.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Move later sections too' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    expect(savedBody().upsert.map((item) => [item.section_id, item.start_date, item.num_days])).toEqual([
      [sections[1].sectionId, '2026-10-13', 2],
      [sections[2].sectionId, '2026-10-15', 1],
    ]);
  });

  it('can move only this section', async () => {
    const sections = [
      sectionOf(1, scheduleOf({ startDate: '2026-10-12', endDate: '2026-10-12' })),
      sectionOf(2, scheduleOf({ startDate: '2026-10-13', endDate: '2026-10-13' })),
    ];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    axiosMock.onPut(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderModal(sections[0].sectionId, 'Lesson 1');

    fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: '2026-10-11' } });
    expect(screen.getByText(/move by −1 day/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Move later sections too' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    expect(savedBody().upsert).toHaveLength(1);
  });

  it('steps the number of days, reveals notes and previews what learners see', async () => {
    const sections = [sectionOf(1, scheduleOf({ startDate: '2026-10-12', endDate: '2026-10-12' }))];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderModal(sections[0].sectionId, 'Lesson 1');

    expect(await screen.findByText('Section 1 of 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toHaveValue('Mon, 12 Oct 2026');
    expect(screen.getByLabelText('Start time')).toHaveValue('7:00 PM');
    expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
    const preview = screen.getByTestId('course-schedule-preview');
    expect(preview).toHaveTextContent('Lesson 1');
    expect(screen.getByText('Mon, Oct 12, 2026')).toBeInTheDocument(); // the day heading, as on the Dates page
    expect(preview).toHaveTextContent('7:00 PM–8:30 PM IST');

    expect(screen.getByRole('button', { name: 'Fewer days' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'More days' }));
    expect(screen.getByLabelText('Number of days')).toHaveValue(2);
    expect(screen.getByText('Mon, Oct 12 → Tue, Oct 13')).toBeInTheDocument(); // under the date
    expect(preview).toHaveTextContent('7:00 PM–8:30 PM IST · Mon, Oct 12 → Tue, Oct 13');

    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add notes' }));
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Bring a cushion' } });
    fireEvent.change(screen.getByLabelText('Instructor'), { target: { value: 'Ani Pema' } });
    expect(preview).toHaveTextContent('Instructor: Ani Pema');
    expect(preview).toHaveTextContent('Bring a cushion');
  });

  it('says so when the section is no longer in the course, instead of spinning', async () => {
    const sections = [sectionOf(1)];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderModal('block-v1:Sherab+T+2026+type@chapter+block@deleted', 'Gone');

    expect(await screen.findByText(/no longer in the course/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('validates before saving', async () => {
    const sections = [sectionOf(1)];
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload(sections));
    renderModal(sections[0].sectionId, 'Lesson 1');

    fireEvent.change(await screen.findByLabelText('End time'), { target: { value: '20:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

    expect(screen.getByText('Choose a start date.')).toBeInTheDocument();
    expect(screen.getByText('Set a start time before an end time.')).toBeInTheDocument();
    expect(axiosMock.history.put.length).toBe(0);
  });

  it('shows server warnings and errors, and can remove the schedule', async () => {
    const section = {
      ...sectionOf(1, scheduleOf()),
      warnings: [{ code: 'before_release', params: { date: '2026-10-20' } }],
    };
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([section as any]));
    axiosMock.onPut(getCourseScheduleUrl(courseId)).replyOnce(400, { error: 'Course schedules are turned off.' });
    renderModal(section.sectionId, 'Lesson 1');

    expect(await screen.findByText(/Before this section's content is released/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove schedule' }));
    expect(await screen.findByText('Course schedules are turned off.')).toBeInTheDocument();
    expect(savedBody()).toEqual({ remove: [section.sectionId] });
  });
});
