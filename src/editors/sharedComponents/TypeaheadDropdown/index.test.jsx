import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TypeaheadDropdown from '.';

jest.unmock('@openedx/paragon');
jest.unmock('@openedx/paragon/icons');

const defaultProps = {
  as: 'input',
  name: 'OrganizationDropdown',
  floatingLabel: 'floatingLabel text',
  options: null,
  handleFocus: null,
  handleChange: null,
  handleBlur: null,
  value: null,
  errorMessage: null,
  errorCode: null,
  readOnly: false,
  noOptionsMessage: 'No options',
};
const renderComponent = (props) => render(<TypeaheadDropdown {...props} />);

describe('common/OrganizationDropdown.jsx', () => {
  it('renders component without error', () => {
    renderComponent(defaultProps);
    expect(screen.getByText(defaultProps.floatingLabel)).toBeVisible();
  });
  it('handles element focus', () => {
    const mockHandleFocus = jest.fn();
    const newProps = { ...defaultProps, handleFocus: mockHandleFocus };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.focus(formInput);
    expect(mockHandleFocus).toHaveBeenCalled();
  });
  it('handles element blur', () => {
    const mockHandleBlur = jest.fn();
    const newProps = { ...defaultProps, handleBlur: mockHandleBlur };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.focus(formInput);
    fireEvent.focusOut(formInput);
    expect(mockHandleBlur).toHaveBeenCalled();
  });
  it('renders component with options', async () => {
    const newProps = { ...defaultProps, options: ['opt2', 'opt1'] };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    await waitFor(() => fireEvent.click(formInput));
    const optionsList = within(screen.getByTestId('dropdown-container')).getAllByRole('button');
    expect(optionsList.length).toEqual(newProps.options.length);
  });
  it('selects option', () => {
    const newProps = { ...defaultProps, options: ['opt1', 'opt2'] };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.click(screen.getByTestId('expand-more-button'));
    const optionsList = within(screen.getByTestId('dropdown-container')).getAllByRole('button');
    fireEvent.click(optionsList.at([0]));
    expect(formInput.value).toEqual(newProps.options[0]);
  });
  it('selects long organization name correctly', () => {
    const longOrgName = 'PalpungThuptenLungtokKunphenCholing';
    const newProps = { ...defaultProps, options: ['ShortOrg', longOrgName] };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.click(formInput);
    const optionsList = within(screen.getByTestId('dropdown-container')).getAllByRole('button');
    // Find the button with the long org name
    const longOrgButton = optionsList.find(btn => btn.value === longOrgName);
    expect(longOrgButton).toBeTruthy();
    expect(longOrgButton.title).toEqual(longOrgName);
    fireEvent.click(longOrgButton);
    expect(formInput.value).toEqual(longOrgName);
  });
  it('shows a full organization name while returning its technical identifier', () => {
    const handleChange = jest.fn();
    const newProps = {
      ...defaultProps,
      options: ['Khyentse_Foundation'],
      optionLabels: { Khyentse_Foundation: 'Khyentse Foundation' },
      handleChange,
    };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.click(screen.getByTestId('expand-more-button'));
    const organizationButton = within(screen.getByTestId('dropdown-container')).getByRole('button', {
      name: 'Khyentse Foundation',
    });

    fireEvent.click(organizationButton);
    expect(formInput.value).toEqual('Khyentse Foundation');
    expect(handleChange).toHaveBeenCalledWith('Khyentse_Foundation');
  });
  it('toggles options list', async () => {
    const newProps = { ...defaultProps, options: ['opt1', 'opt2'] };
    renderComponent(newProps);
    const optionsList = within(screen.getByTestId('dropdown-container')).queryAllByRole('button');
    expect(optionsList.length).toEqual(0);
    await act(async () => {
      fireEvent.click(screen.getByTestId('expand-more-button'));
    });
    expect(within(screen.getByTestId('dropdown-container'))
      .queryAllByRole('button').length).toEqual(newProps.options.length);
    await act(async () => {
      fireEvent.click(screen.getByTestId('expand-less-button'));
    });
    expect(within(screen.getByTestId('dropdown-container'))
      .queryAllByRole('button').length).toEqual(0);
  });
  it('shows options list depends on field value', async () => {
    const user = userEvent.setup();
    const newProps = { ...defaultProps, options: ['opt1', 'opt2'] };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.focus(formInput);
    await user.type(formInput, 'opt1');
    expect(within(screen.getByTestId('dropdown-container'))
      .queryAllByRole('button').length).toEqual(1);
  });
  it('closes options list on click outside', async () => {
    const user = userEvent.setup();
    const newProps = { ...defaultProps, options: ['opt1', 'opt2'] };
    renderComponent(newProps);
    const formInput = screen.getByTestId('formControl');
    fireEvent.click(formInput);
    expect(within(screen.getByTestId('dropdown-container'))
      .queryAllByRole('button').length).toEqual(2);
    await user.click(document.body);
    expect(within(screen.getByTestId('dropdown-container'))
      .queryAllByRole('button').length).toEqual(0);
  });
  describe('empty options list', () => {
    it('shows empty options list depends on field value', async () => {
      const user = userEvent.setup();
      const newProps = { ...defaultProps, options: ['opt1', 'opt2'] };
      renderComponent(newProps);
      const formInput = screen.getByTestId('formControl');
      fireEvent.focus(formInput);
      await user.type(formInput, '3');
      const noOptionsList = within(screen.getByTestId('dropdown-container')).getByText('No options');
      const addButton = within(screen.getByTestId('dropdown-container')).queryByTestId('add-option-button');
      expect(noOptionsList).toBeVisible();
      expect(addButton).toBeNull();
    });
    it('shows empty options list with add option button', async () => {
      const newProps = {
        ...defaultProps,
        options: ['opt1', 'opt2'],
        allowNewOption: true,
        newOptionButtonLabel: 'Add new option',
        addNewOption: jest.fn(),
      };
      const user = userEvent.setup();
      renderComponent(newProps);
      const formInput = screen.getByTestId('formControl');
      fireEvent.focus(formInput);
      await user.type(formInput, '3');
      const noOptionsList = within(screen.getByTestId('dropdown-container')).getByText('No options');
      expect(noOptionsList).toBeVisible();
      const addButton = within(screen.getByTestId('dropdown-container')).getByTestId('add-option-button');
      expect(addButton).toHaveTextContent(newProps.newOptionButtonLabel);
    });
  });
});
