import 'package:flutter_riverpod/flutter_riverpod.dart';

enum OrbitMode { slingshot, gravityWell, seal }

final orbitModeProvider = StateProvider<OrbitMode>((ref) {
  return OrbitMode.slingshot;
});

final walletModeProvider = StateProvider<bool>((ref) {
  return false;
});
