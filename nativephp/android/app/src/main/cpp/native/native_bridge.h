#ifndef NATIVE_BRIDGE_H
#define NATIVE_BRIDGE_H

#include <jni.h>

#ifdef __cplusplus
extern "C" {
#endif

// === Android-to-PHP native bridge declarations ===

void NativePHPVibrate(void);
void NativePHPShowAlert(const char *title, const char *message, const char **buttons, int buttonCount, void (*callback)(int));
void NativePHPShowToast(const char *message);
void NativePHPShare(const char *title, const char *message);
void NativePHPOpenCamera(void);
void NativePHPToggleFlashlight(void);
void NativePHPLocalAuthChallenge(void);
void NativePHPGetApnsToken(void);



#ifdef __cplusplus
}
#endif

#endif // NATIVE_BRIDGE_H
