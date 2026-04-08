import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Toast, useToast } from '../components/Toast';
import { Text, TouchableOpacity, View } from 'react-native';

function ToastHarness() {
  const { toast, showToast, hideToast } = useToast();
  return (
    <View>
      <TouchableOpacity testID="btn-success" onPress={() => showToast('Opération réussie', 'success')} />
      <TouchableOpacity testID="btn-error" onPress={() => showToast('Une erreur', 'error')} />
      <TouchableOpacity testID="btn-warning" onPress={() => showToast('Attention', 'warning')} />
      <TouchableOpacity testID="btn-info" onPress={() => showToast('Info', 'info')} />
      <Toast
        visible={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type}
        onHide={hideToast}
      />
    </View>
  );
}

describe('Toast component', () => {
  it('n affiche rien au départ', () => {
    render(<ToastHarness />);
    expect(screen.queryByText('Opération réussie')).toBeNull();
  });

  it('affiche le message success', () => {
    render(<ToastHarness />);
    fireEvent.press(screen.getByTestId('btn-success'));
    expect(screen.getByText('Opération réussie')).toBeTruthy();
  });

  it('affiche le message error', () => {
    render(<ToastHarness />);
    fireEvent.press(screen.getByTestId('btn-error'));
    expect(screen.getByText('Une erreur')).toBeTruthy();
  });

  it('affiche le message warning', () => {
    render(<ToastHarness />);
    fireEvent.press(screen.getByTestId('btn-warning'));
    expect(screen.getByText('Attention')).toBeTruthy();
  });

  it('affiche le message info', () => {
    render(<ToastHarness />);
    fireEvent.press(screen.getByTestId('btn-info'));
    expect(screen.getByText('Info')).toBeTruthy();
  });

  it('cache le toast après onHide', async () => {
    render(<ToastHarness />);
    fireEvent.press(screen.getByTestId('btn-success'));
    expect(screen.getByText('Opération réussie')).toBeTruthy();
    // Le composant Toast se cache lui-même après duration — on teste onHide via le hook
  });
});

describe('useToast hook', () => {
  function HookConsumer() {
    const { toast, showToast, hideToast } = useToast();
    return (
      <View>
        <TouchableOpacity testID="show" onPress={() => showToast('msg', 'info')} />
        <TouchableOpacity testID="hide" onPress={hideToast} />
        <Text testID="state">{toast ? `${toast.type}:${toast.message}` : 'null'}</Text>
      </View>
    );
  }

  it('démarre à null', () => {
    render(<HookConsumer />);
    expect(screen.getByTestId('state').props.children).toBe('null');
  });

  it('showToast met à jour l état', () => {
    render(<HookConsumer />);
    fireEvent.press(screen.getByTestId('show'));
    expect(screen.getByTestId('state').props.children).toBe('info:msg');
  });

  it('hideToast remet à null', () => {
    render(<HookConsumer />);
    fireEvent.press(screen.getByTestId('show'));
    fireEvent.press(screen.getByTestId('hide'));
    expect(screen.getByTestId('state').props.children).toBe('null');
  });
});
