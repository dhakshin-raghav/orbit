import 'dart:math';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../models/orbit_category.dart';

class SlingshotView extends StatefulWidget {
  const SlingshotView({super.key});

  @override
  State<SlingshotView> createState() => _SlingshotViewState();
}

class _SlingshotViewState extends State<SlingshotView>
    with TickerProviderStateMixin {
  static const double _zoneHeight = 300;
  static const double _maxPull = 160;
  static const double _maxHorizontal = 120;

  final SpringDescription _spring = const SpringDescription(
    mass: 1.2,
    stiffness: 260,
    damping: 20,
  );

  late final AnimationController _xController;
  late final AnimationController _yController;
  late final AnimationController _rippleController;

  Offset _dragOffset = Offset.zero;
  bool _isDragging = false;
  OrbitCategory _category = OrbitCategory.food;
  double _amount = 0;
  double _rippleProgress = 0;
  bool _returning = false;

  @override
  void initState() {
    super.initState();
    _xController = AnimationController.unbounded(vsync: this)
      ..addListener(_syncFromControllers);
    _yController = AnimationController.unbounded(vsync: this)
      ..addListener(_syncFromControllers);
    _rippleController = AnimationController.unbounded(vsync: this)
      ..addListener(() {
        setState(() {
          _rippleProgress = _rippleController.value.clamp(0, 1);
        });
      });
  }

  @override
  void dispose() {
    _xController.dispose();
    _yController.dispose();
    _rippleController.dispose();
    super.dispose();
  }

  void _syncFromControllers() {
    setState(() {
      _dragOffset = Offset(_xController.value, _yController.value);
    });
  }

  void _updateCategory(double dx) {
    final normalized = (dx / _maxHorizontal).clamp(-1.0, 1.0);
    final index = ((normalized + 1) * 0.5 * (OrbitCategory.values.length - 1))
        .round()
        .clamp(0, OrbitCategory.values.length - 1);
    _category = OrbitCategory.values[index];
  }

  void _updateAmount(double dy) {
    _amount = (dy / _maxPull * 200).clamp(0, 200);
  }

  void _onPanStart(DragStartDetails details) {
    _isDragging = true;
    _returning = false;
    _xController.stop();
    _yController.stop();
    setState(() {});
  }

  void _onPanUpdate(DragUpdateDetails details) {
    final next = _dragOffset + details.delta;
    final clamped = Offset(
      next.dx.clamp(-_maxHorizontal, _maxHorizontal),
      next.dy.clamp(0, _maxPull),
    );
    setState(() {
      _dragOffset = clamped;
      _updateCategory(clamped.dx);
      _updateAmount(clamped.dy);
    });
  }

  Future<void> _onPanEnd(DragEndDetails details) async {
    _isDragging = false;
    final launchHeight = -200 - (_dragOffset.dy * 0.8);
    final target = Offset(0, launchHeight);
    await _runSpring(_dragOffset, target);
    if (!mounted) {
      return;
    }
    _triggerRipple();
    _returning = true;
    await _runSpring(target, Offset.zero);
    if (!mounted) {
      return;
    }
    setState(() {
      _returning = false;
      _amount = 0;
    });
  }

  Future<void> _runSpring(Offset from, Offset to) async {
    _xController.value = from.dx;
    _yController.value = from.dy;
    final futureX = _xController.animateWith(
      SpringSimulation(_spring, from.dx, to.dx, 0),
    );
    final futureY = _yController.animateWith(
      SpringSimulation(_spring, from.dy, to.dy, 0),
    );
    await Future.wait([futureX, futureY]);
  }

  void _triggerRipple() {
    _rippleController.value = 0;
    _rippleController.animateWith(
      SpringSimulation(
        const SpringDescription(mass: 1, stiffness: 180, damping: 16),
        0,
        1,
        0,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: _zoneHeight,
      width: double.infinity,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final anchor = Offset(constraints.maxWidth / 2, _zoneHeight - 80);
          final puckPosition = anchor + _dragOffset;
          final lineStrength = (_dragOffset.dy / _maxPull).clamp(0.0, 1.0);
          final dialRotation = (_dragOffset.dx / _maxHorizontal) * pi / 6;

          return Stack(
            children: [
              Positioned.fill(
                child: CustomPaint(
                  painter: _SlingshotLinePainter(
                    anchor: anchor,
                    puck: puckPosition,
                    tension: lineStrength,
                  ),
                ),
              ),
              Positioned(
                top: -60,
                left: (constraints.maxWidth - 220) / 2,
                child: IgnorePointer(
                  child: CustomPaint(
                    painter: _RipplePainter(progress: _rippleProgress),
                    size: const Size(220, 140),
                  ),
                ),
              ),
              Positioned(
                top: 24,
                left: 0,
                right: 0,
                child: Column(
                  children: [
                    Text(
                      '\$${_amount.toStringAsFixed(0)}',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                    )
                        .animate(target: _isDragging ? 1 : 0)
                        .scale(
                          begin: const Offset(1, 1),
                          end: const Offset(1.05, 1.05),
                          curve: Curves.easeOutBack,
                          duration: 350.ms,
                        )
                        .fade(
                          begin: 0.6,
                          end: 1,
                          duration: 350.ms,
                        ),
                    const SizedBox(height: 6),
                    Text(
                      _category.label.toUpperCase(),
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            letterSpacing: 2,
                            color: Colors.white.withOpacity(0.7),
                          ),
                    ),
                  ],
                ),
              ),
              Positioned(
                left: anchor.dx - 70,
                top: anchor.dy - 70,
                child: Transform.rotate(
                  angle: dialRotation,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withOpacity(0.2),
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.7),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: puckPosition.dx - 30,
                top: puckPosition.dy - 30,
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.9),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withOpacity(0.2),
                        blurRadius: 16,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
              ),
              Positioned.fill(
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onPanStart: _onPanStart,
                  onPanUpdate: _onPanUpdate,
                  onPanEnd: _onPanEnd,
                ),
              ),
              if (_returning)
                Positioned(
                  bottom: 18,
                  left: 0,
                  right: 0,
                  child: Text(
                    'LAUNCHING',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withOpacity(0.5),
                          letterSpacing: 3,
                        ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _SlingshotLinePainter extends CustomPainter {
  _SlingshotLinePainter({
    required this.anchor,
    required this.puck,
    required this.tension,
  });

  final Offset anchor;
  final Offset puck;
  final double tension;

  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = Colors.white.withOpacity(0.2 + tension * 0.6)
      ..strokeWidth = 2 + tension * 3
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(anchor, puck, linePaint);

    final anchorPaint = Paint()
      ..color = Colors.white.withOpacity(0.35 + tension * 0.3);
    canvas.drawCircle(anchor, 6 + tension * 2, anchorPaint);
  }

  @override
  bool shouldRepaint(covariant _SlingshotLinePainter oldDelegate) {
    return oldDelegate.anchor != anchor ||
        oldDelegate.puck != puck ||
        oldDelegate.tension != tension;
  }
}

class _RipplePainter extends CustomPainter {
  _RipplePainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    if (progress == 0) {
      return;
    }
    final center = Offset(size.width / 2, size.height / 2);
    final radius = lerpDouble(20, size.width * 0.45, progress) ?? 20;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = lerpDouble(2, 6, 1 - progress) ?? 2
      ..color = Colors.white.withOpacity(0.4 * (1 - progress));
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(covariant _RipplePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
