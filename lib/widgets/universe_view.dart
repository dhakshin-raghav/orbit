import 'dart:math';

import 'package:flutter/material.dart';

class UniverseView extends StatelessWidget {
  const UniverseView({super.key, this.walletMode = false});

  final bool walletMode;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _UniversePainter(walletMode: walletMode),
      child: const SizedBox.expand(),
    );
  }
}

class _UniversePainter extends CustomPainter {
  _UniversePainter({required this.walletMode});

  final bool walletMode;
  final Random _random = Random(42);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    const baseColor = Color(0xFF05070D);
    final gradient = RadialGradient(
      center: const Alignment(0.0, -0.4),
      radius: 1.2,
      colors: [
        baseColor.withOpacity(0.9),
        const Color(0xFF020307),
      ],
    );
    canvas.drawRect(rect, Paint()..shader = gradient.createShader(rect));

    if (!walletMode) {
      final starPaint = Paint()..color = Colors.white.withOpacity(0.6);
      for (int i = 0; i < 90; i++) {
        final dx = _random.nextDouble() * size.width;
        final dy = _random.nextDouble() * size.height * 0.65;
        final radius = _random.nextDouble() * 1.4 + 0.4;
        canvas.drawCircle(Offset(dx, dy), radius, starPaint);
      }
    }

    final glowPaint = Paint()
      ..color = Colors.white.withOpacity(0.08)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 40);
    canvas.drawCircle(
      Offset(size.width * 0.6, size.height * 0.25),
      size.width * 0.18,
      glowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _UniversePainter oldDelegate) => false;
}
import 'dart:math';

import 'package:flutter/material.dart';

class UniverseView extends StatelessWidget {
  const UniverseView({super.key, this.walletMode = false});

  final bool walletMode;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _UniversePainter(walletMode: walletMode),
      child: const SizedBox.expand(),
    );
  }
}

class _UniversePainter extends CustomPainter {
  _UniversePainter({required this.walletMode});

  final bool walletMode;
  final Random _random = Random(42);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final baseColor = walletMode ? const Color(0xFF050506) : const Color(0xFF05070D);
    final gradient = RadialGradient(
      center: const Alignment(0.0, -0.4),
      radius: 1.2,
      colors: [
        baseColor.withOpacity(0.9),
        walletMode ? const Color(0xFF0C0D12) : const Color(0xFF020307),
      ],
    );
    canvas.drawRect(rect, Paint()..shader = gradient.createShader(rect));

    if (!walletMode) {
      final starPaint = Paint()..color = Colors.white.withOpacity(0.6);
      for (int i = 0; i < 90; i++) {
        final dx = _random.nextDouble() * size.width;
        final dy = _random.nextDouble() * size.height * 0.65;
        final radius = _random.nextDouble() * 1.4 + 0.4;
        canvas.drawCircle(Offset(dx, dy), radius, starPaint);
      }
    }

    final glowPaint = Paint()
      ..color = Colors.white.withOpacity(0.08)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 40);
    canvas.drawCircle(
      Offset(size.width * 0.6, size.height * 0.25),
      size.width * 0.18,
      glowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _UniversePainter oldDelegate) => false;
}
import 'dart:math';

import 'package:flutter/material.dart';

class UniverseView extends StatelessWidget {
  const UniverseView({super.key, this.walletMode = false});

  final bool walletMode;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _UniversePainter(walletMode: walletMode),
      child: const SizedBox.expand(),
    );
  }
}

class _UniversePainter extends CustomPainter {
  _UniversePainter({required this.walletMode});

  final bool walletMode;
  final Random _random = Random(42);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final baseColor = walletMode ? const Color(0xFF050506) : const Color(0xFF05070D);
    final gradient = RadialGradient(
      center: const Alignment(0.0, -0.4),
      radius: 1.2,
      colors: [
        baseColor.withOpacity(0.9),
        walletMode ? const Color(0xFF0C0D12) : const Color(0xFF020307),
      ],
    );
    canvas.drawRect(rect, Paint()..shader = gradient.createShader(rect));

    if (!walletMode) {
      final starPaint = Paint()..color = Colors.white.withOpacity(0.6);
      for (int i = 0; i < 90; i++) {
        final dx = _random.nextDouble() * size.width;
        final dy = _random.nextDouble() * size.height * 0.65;
        final radius = _random.nextDouble() * 1.4 + 0.4;
        canvas.drawCircle(Offset(dx, dy), radius, starPaint);
      }
    }

    final glowPaint = Paint()
      ..color = Colors.white.withOpacity(0.08)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 40);
    canvas.drawCircle(
      Offset(size.width * 0.6, size.height * 0.25),
      size.width * 0.18,
      glowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _UniversePainter oldDelegate) =>
      oldDelegate.walletMode != walletMode;
}
