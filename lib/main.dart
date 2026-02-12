import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'state/orbit_state.dart';
import 'widgets/gravity_well_view.dart';
import 'widgets/seal_view.dart';
import 'widgets/slingshot_view.dart';
import 'widgets/universe_view.dart';

void main() {
  runApp(const ProviderScope(child: OrbitApp()));
}

class OrbitApp extends StatelessWidget {
  const OrbitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: const UniverseScreen(),
    );
  }
}

class UniverseScreen extends StatelessWidget {
  const UniverseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Stack(
        children: [
          UniverseView(),
          Align(
            alignment: Alignment.bottomCenter,
            child: SlingshotView(),
          ),
        ],
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'state/orbit_state.dart';
import 'widgets/gravity_well_view.dart';
import 'widgets/seal_view.dart';
import 'widgets/slingshot_view.dart';
import 'widgets/universe_view.dart';

void main() {
  runApp(const ProviderScope(child: OrbitApp()));
}

class OrbitApp extends StatelessWidget {
  const OrbitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: const UniverseScreen(),
    );
  }
}

class UniverseScreen extends ConsumerWidget {
  const UniverseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletMode = ref.watch(walletModeProvider);
    final mode = ref.watch(orbitModeProvider);
    final activeMode = walletMode ? OrbitMode.seal : mode;

    return Scaffold(
      body: Stack(
        children: [
          UniverseView(walletMode: walletMode),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: switch (activeMode) {
              OrbitMode.slingshot => const Align(
                  alignment: Alignment.bottomCenter,
                  child: SlingshotView(),
                ),
              OrbitMode.gravityWell => const GravityWellView(),
              OrbitMode.seal => const SealView(),
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (!walletMode)
                    SegmentedButton<OrbitMode>(
                      showSelectedIcon: false,
                      style: ButtonStyle(
                        foregroundColor: WidgetStatePropertyAll(
                          Colors.white.withOpacity(0.8),
                        ),
                        backgroundColor: WidgetStatePropertyAll(
                          Colors.white.withOpacity(0.06),
                        ),
                      ),
                      segments: const [
                        ButtonSegment(
                          value: OrbitMode.slingshot,
                          label: Text('SOLID'),
                        ),
                        ButtonSegment(
                          value: OrbitMode.gravityWell,
                          label: Text('LIQUID'),
                        ),
                      ],
                      selected: {mode},
                      onSelectionChanged: (selection) {
                        ref.read(orbitModeProvider.notifier).state =
                            selection.first;
                      },
                    )
                  else
                    const SizedBox(width: 10),
                  Row(
                    children: [
                      Text(
                        'Wallet',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: Colors.white.withOpacity(0.7),
                            ),
                      ),
                      const SizedBox(width: 8),
                      Switch.adaptive(
                        value: walletMode,
                        onChanged: (value) {
                          ref.read(walletModeProvider.notifier).state = value;
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
