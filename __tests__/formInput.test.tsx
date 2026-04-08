import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { FormInput } from '../components/FormInput';

function Wrapped(props: any) {
  return (
    <ThemeProvider>
      <FormInput {...props} />
    </ThemeProvider>
  );
}

describe('FormInput', () => {
  it('affiche le placeholder', () => {
    render(<Wrapped placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
  });

  it('affiche l icone si fournie', () => {
    render(<Wrapped placeholder="Email" icon="📧" />);
    expect(screen.getByText('📧')).toBeTruthy();
  });

  it('n affiche pas l icone si absente', () => {
    render(<Wrapped placeholder="Email" />);
    expect(screen.queryByText('📧')).toBeNull();
  });

  it('applique le focus et le blur', () => {
    render(<Wrapped placeholder="Mdp" />);
    const input = screen.getByPlaceholderText('Mdp');
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
    // Pas d'erreur = succès (les styles changent mais pas facilement vérifiables en unit)
  });

  it('transmet onChangeText', () => {
    const onChange = jest.fn();
    render(<Wrapped placeholder="Nom" onChangeText={onChange} />);
    fireEvent.changeText(screen.getByPlaceholderText('Nom'), 'Alice');
    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('affiche le bouton œil sur un champ secureTextEntry', () => {
    render(<Wrapped placeholder="Mdp" secureTextEntry />);
    expect(screen.getByLabelText('Afficher le mot de passe')).toBeTruthy();
  });

  it('toggle la visibilité du mot de passe', () => {
    render(<Wrapped placeholder="Mdp" secureTextEntry />);
    fireEvent.press(screen.getByLabelText('Afficher le mot de passe'));
    expect(screen.getByLabelText('Masquer le mot de passe')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Masquer le mot de passe'));
    expect(screen.getByLabelText('Afficher le mot de passe')).toBeTruthy();
  });

  it('n affiche pas le bouton œil sans secureTextEntry', () => {
    render(<Wrapped placeholder="Email" />);
    expect(screen.queryByLabelText('Afficher le mot de passe')).toBeNull();
  });
});
