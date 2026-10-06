// Puts the phone's text size into Memory's initial load.
//
// The iPhone display code Memory is built on reads that size while the
// app is still starting, and the ordinary size is the one the writing
// keeps. This waits until the app is active, reads the phone's text
// size, and builds the first writing from that reading.
//
// The generated ios folder is not kept, and a fresh install of the
// project libraries restores the original display code. This file puts
// the reading back. It does nothing if the reading is already there.

const fs = require('fs');
const path = require('path');

const MARK = 'Memory: initial phone text size';

function replaceOnce(text, from, to, file) {
  if (!text.includes(from)) {
    throw new Error('The phone text size reading could not find its place in ' + file);
  }
  return text.replace(from, to);
}

function applyPhoneTextSize(projectRoot) {
  const utilsFile = path.join(
    projectRoot,
    'node_modules/react-native/React/Base/RCTUtils.mm',
  );
  const surfaceFile = path.join(
    projectRoot,
    'node_modules/react-native/React/Fabric/Surface/RCTFabricSurface.mm',
  );

  patchUtils(utilsFile);
  patchSurface(surfaceFile);
}

function patchUtils(file) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(MARK)) return;
  text = replaceOnce(
    text,
    '  return mapping[RCTSharedApplication().preferredContentSizeCategory].floatValue;\n}',
    `  // ${MARK}. The key window has the phone's real
  // text size once the app is up. A read before that can come back as the
  // ordinary size, and a missing category must not become a zero size.
  NSString *category = nil;
  if (RCTIsMainQueue()) {
    UIWindow *window = RCTKeyWindow();
    if (window != nil) {
      category = window.traitCollection.preferredContentSizeCategory;
    }
  }
  if (category.length == 0 || [category isEqualToString:UIContentSizeCategoryUnspecified]) {
    UIApplication *application = RCTSharedApplication();
    if (application != nil) {
      category = application.preferredContentSizeCategory;
    }
  }
  NSNumber *match = category != nil ? mapping[category] : nil;
  CGFloat multiplier = match != nil ? match.floatValue : 0.0;
  return multiplier > 0.0 ? multiplier : 1.0;
}`,
    file,
  );
  fs.writeFileSync(file, text);
}

function patchSurface(file) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(MARK)) return;

  text = replaceOnce(
    text,
    `  // Can be accessed from the main thread only.
  RCTSurfaceView *_Nullable _view;
  RCTSurfaceTouchHandler *_Nullable _touchHandler;
}`,
    `  // Can be accessed from the main thread only.
  RCTSurfaceView *_Nullable _view;
  RCTSurfaceTouchHandler *_Nullable _touchHandler;

  // ${MARK}. Keeps start from being scheduled twice.
  BOOL _didSchedulePhoneTextSizeStart;
}`,
    file,
  );

  text = replaceOnce(
    text,
    `- (void)dealloc
{
  [_surfacePresenter unregisterSurface:self];
}`,
    `- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationDidBecomeActiveNotification
                                                object:nil];
  [_surfacePresenter unregisterSurface:self];
}`,
    file,
  );

  text = replaceOnce(
    text,
    `- (void)start
{
  std::lock_guard<std::mutex> lock(_surfaceMutex);

  if (_surfaceHandler->getStatus() != SurfaceHandler::Status::Registered) {
    return;
  }

  // We need to register a root view component here synchronously because right after
  // we start a surface, it can initiate an update that can query the root component.
  RCTExecuteOnMainQueue(^{
    [self->_surfacePresenter.mountingManager attachSurfaceToView:self.view
                                                       surfaceId:self->_surfaceHandler->getSurfaceId()];
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
      self->_surfaceHandler->start();
      [self _propagateStageChange];

      [self->_surfacePresenter setupAnimationDriverWithSurfaceHandler:*self->_surfaceHandler];
    });
  });
}`,
    `- (void)start
{
  std::lock_guard<std::mutex> lock(_surfaceMutex);

  if (_surfaceHandler->getStatus() != SurfaceHandler::Status::Registered) {
    return;
  }
  if (_didSchedulePhoneTextSizeStart) {
    return;
  }
  _didSchedulePhoneTextSizeStart = YES;

  // We need to register a root view component here synchronously because right after
  // we start a surface, it can initiate an update that can query the root component.
  // ${MARK}. The writing is built from the text size read
  // here. During a foreground open that read is still the ordinary size, so the
  // surface waits until the app is active and reads again before the first writing.
  RCTExecuteOnMainQueue(^{
    [self->_surfacePresenter.mountingManager attachSurfaceToView:self.view
                                                       surfaceId:self->_surfaceHandler->getSurfaceId()];
    UIApplication *application = RCTSharedApplication();
    if (application == nil || application.applicationState != UIApplicationStateInactive) {
      if (application.applicationState == UIApplicationStateActive) {
        [self _updateLayoutContext];
      }
      [self _startSurfaceWork];
      return;
    }
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_phoneTextSizeReady:)
                                                 name:UIApplicationDidBecomeActiveNotification
                                               object:nil];
    // If the app became active before the note was watched, start on the next turn.
    dispatch_async(dispatch_get_main_queue(), ^{
      UIApplication *later = RCTSharedApplication();
      if (later.applicationState == UIApplicationStateActive) {
        [self _phoneTextSizeReady:nil];
      }
    });
  });
}

- (void)_phoneTextSizeReady:(NSNotification *)notification
{
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationDidBecomeActiveNotification
                                                object:nil];
  [self _updateLayoutContext];
  [self _startSurfaceWork];
}

- (void)_startSurfaceWork
{
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    std::lock_guard<std::mutex> lock(self->_surfaceMutex);
    if (self->_surfaceHandler->getStatus() != SurfaceHandler::Status::Registered) {
      return;
    }
    self->_surfaceHandler->start();
    [self _propagateStageChange];
    [self->_surfacePresenter setupAnimationDriverWithSurfaceHandler:*self->_surfaceHandler];
  });
}`,
    file,
  );

  text = replaceOnce(
    text,
    `- (void)stop
{
  std::lock_guard<std::mutex> lock(_surfaceMutex);`,
    `- (void)stop
{
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationDidBecomeActiveNotification
                                                object:nil];
  std::lock_guard<std::mutex> lock(_surfaceMutex);
  _didSchedulePhoneTextSizeStart = NO;`,
    file,
  );

  fs.writeFileSync(file, text);
}

if (require.main === module) {
  applyPhoneTextSize(path.join(__dirname, '..'));
}

module.exports = { applyPhoneTextSize };
