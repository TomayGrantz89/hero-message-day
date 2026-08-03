package com.goldenhare.cardapp; // Ваше правильное имя пакета

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(RuStorePayBridge.class);
    super.onCreate(savedInstanceState);
  }
}

@CapacitorPlugin(name = "RuStorePayBridge")
class RuStorePayBridge extends Plugin {

  // Простой метод, который Angular вызовет при старте
  @PluginMethod
  public void checkPremiumStatus(PluginCall call) {
    com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
    // Отдаем false для обычного режима (14 карт), true — для полной версии (60 карт)
    ret.put("isPurchased", false);
    call.resolve(ret);
  }

  // Простой метод, который сработает при клике на вашу кнопку "Купить"
  @PluginMethod
  public void startPaymentFlow(PluginCall call) {
    com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
    // Возвращаем true, чтобы Angular понял, что нативная кнопка нажата успешно
    ret.put("success", true);
    call.resolve(ret);
  }
}
