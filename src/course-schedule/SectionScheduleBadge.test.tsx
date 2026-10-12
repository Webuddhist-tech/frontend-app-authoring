import userEvent from '@testing-library/user-event';

import { initializeMocks, render, screen } from '@src/testUtils';
import { getCourseScheduleUrl } from './data/api';
import SectionScheduleBadge from './SectionScheduleBadge';
import {
  apiPayload, courseId, scheduleOf, sectionOf,
} from './testData';

let axiosMock;

const renderBadge = (sectionId: string, isSelfPaced = false) => render(
  <SectionScheduleBadge courseId={courseId} sectionId={sectionId} displayName="Lesson 1" isSelfPaced={isSelfPaced} />,
  { path: '/course/:courseId', params: { courseId } },
);

describe('<SectionScheduleBadge />', () => {
  beforeEach(() => {
    axiosMock = initializeMocks().axiosMock;
  });

  it('shows the session as a chip', async () => {
    const section = sectionOf(1, scheduleOf());
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([section]));
    renderBadge(section.sectionId);

    const chip = await screen.findByRole('button', { name: /Schedule for Lesson 1/ });
    expect(chip).toHaveTextContent('Mon, Oct 12 · 7:00 PM–8:30 PM IST');
    expect(chip).not.toHaveClass('is-empty');
    expect(chip).not.toHaveClass('has-warnings');
  });

  it('opens the form already filled in, with no spinner', async () => {
    const section = sectionOf(1, scheduleOf({ instructor: 'Geshe Tenzin' }));
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([section]));
    renderBadge(section.sectionId);

    await userEvent.click(await screen.findByRole('button', { name: /Schedule for Lesson 1/ }));
    expect(screen.queryByText('Loading schedule…')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Instructor')).toHaveValue('Geshe Tenzin');
  });

  it('shows a dashed "Add schedule" chip when unscheduled, and opens the form', async () => {
    const section = sectionOf(1);
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([section]));
    renderBadge(section.sectionId);

    const chip = await screen.findByRole('button', { name: /Add schedule/ });
    expect(chip).toHaveClass('is-empty');
    await userEvent.click(chip);
    expect(await screen.findByRole('dialog', { name: 'Schedule: Lesson 1' })).toBeInTheDocument();
  });

  it('marks sections with warnings', async () => {
    const section = { ...sectionOf(1, scheduleOf()), warnings: [{ code: 'overlap', params: { displayName: 'Lesson 2' } }] };
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([section as any]));
    renderBadge(section.sectionId);

    const chip = await screen.findByRole('button', { name: /1 warning/ });
    expect(chip).toHaveClass('has-warnings');
    await userEvent.hover(chip);
    expect(await screen.findByText('Overlaps with Lesson 2')).toBeInTheDocument();
  });

  it('explains on hover that this is when the section is taught, not its release', async () => {
    const section = sectionOf(1, scheduleOf());
    axiosMock.onGet(getCourseScheduleUrl(courseId)).reply(200, apiPayload([section]));
    renderBadge(section.sectionId);

    await userEvent.hover(await screen.findByRole('button', { name: /Schedule for Lesson 1/ }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Class date shown to learners. Separate from the release date.',
    );
  });

  it('renders nothing for self-paced courses', () => {
    renderBadge(sectionOf(1).sectionId, true);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(axiosMock.history.get.filter((request) => request.url.includes('course-schedule'))).toHaveLength(0);
  });
});
