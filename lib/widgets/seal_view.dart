import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SealView extends StatefulWidget {
  const SealView({super.key});

  @override
  State<SealView> createState() => _SealViewState();
}

class _SealViewState extends State<SealView> with TickerProviderStateMixin {
  late final AnimationController _holdController;
  late final AnimationController _shatterController;

  bool _holding = false;
  bool _completed = false;
  double _holdProgress = 0;
  double _shatterProgress = 0;

  @override
  void initState() {
    super.initState();
    _holdController = AnimationController.unbounded(vsync: this)
      ..addListener(() {
        setState(() {
          _holdProgress = _holdController.value.clamp(0, 1);
          if (_holdProgress >= 1 && !_completed) {
            _complete();
          }
        });
      });
    _shatterController = AnimationController.unbounded(vsync: this)
      ..addListener(() {
        setState(() {
          _shatterProgress = _shatterController.value.clamp(0, 1);
        });
      });
  }

  @override
  void dispose() {
    _holdController.dispose();
    _shatterController.dispose();
    super.dispose();
  }

  void _onHoldStart() {
    _holding = true;
    _completed = false;
    _shatterProgress = 0;
    _shatterController.stop();
    _holdController.animateWith(
      SpringSimulation(
        const SpringDescription(mass: 1.4, stiffness: 140, damping: 18),
        _holdController.value,
        1,
        0,
      ),
    );
  }

  void _onHoldEnd() {
    _holding = false;
    if (_completed) {
      return;
    }
    _holdController.animateWith(
      SpringSimulation(
        const SpringDescription(mass: 1, stiffness: 220, damping: 20),
        _holdController.value,
        0,
        0,
      ),
    );
  }

  void _complete() {
    _completed = true;
    HapticFeedback.heavyImpact();
    _shatterController.value = 0;
    _shatterController.animateWith(
      SpringSimulation(
        const SpringDescription(mass: 1, stiffness: 260, damping: 22),
        0,
        1,
        0,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final height = constraints.maxHeight;
        return Stack(
          children: [
            Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.only(top: 80),
                child: Text(
                  _completed ? 'SEALED' : 'WALLET MODE',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        letterSpacing: 3,
                        color: Colors.white.withOpacity(0.6),
                      ),
                ),
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onLongPressStart: (_) => _onHoldStart(),
                onLongPressEnd: (_) => _onHoldEnd(),
                onTapDown: (_) => _onHoldStart(),
                onTapCancel: _onHoldEnd,
                onTapUp: (_) => _onHoldEnd(),
                child: Container(
                  height: height * 0.5,
                  width: double.infinity,
                  padding: const EdgeInsets.only(bottom: 64),
                  decoration: BoxDecoration(
                    color: const Color(0xFF050506).withOpacity(0.9),
                    border: Border(
                      top: BorderSide(
                        color: Colors.white.withOpacity(0.08),
                      ),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 160,
                        height: 160,
                        child: CustomPaint(
                          painter: _RingPainter(
                            progress: _holdProgress,
                            shatterProgress: _shatterProgress,
                            holding: _holding,
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.fingerprint,
                              size: 64,
                              color: Colors.white70,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _completed
                            ? 'TRANSACTION CONFIRMED'
                            : 'PRESS AND HOLD',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: Colors.white.withOpacity(0.6),
                              letterSpacing: 2,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.shatterProgress,
    required this.holding,
  });

  final double progress;
  final double shatterProgress;
  final bool holding;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final baseRadius = size.width * 0.38;
    final shatterScale = lerpDouble(1, 0.75, shatterProgress) ?? 1;
    final radius = baseRadius * shatterScale;

    final trackPaint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6;
    canvas.drawCircle(center, radius, trackPaint);

    final sweepPaint = Paint()
      ..color = Colors.white.withOpacity(0.6)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 8;

    final sweepAngle = (progress.clamp(0, 1)) * 2 * 3.141592653589793;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -1.5708,
      sweepAngle,
      false,
      sweepPaint,
    );

    if (shatterProgress > 0) {
      final shatterPaint = Paint()
        ..color = Colors.white.withOpacity(0.4 * (1 - shatterProgress))
        ..strokeWidth = 2;
      for (int i = 0; i < 12; i++) {
        final angle = (2 * 3.141592653589793 / 12) * i;
        final start = center + Offset(cos(angle), sin(angle)) * radius;
        final end = center + Offset(cos(angle), sin(angle)) *
            (radius - 20 - shatterProgress * 16);
        canvas.drawLine(start, end, shatterPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.shatterProgress != shatterProgress ||
        oldDelegate.holding != holding;
  }
}
