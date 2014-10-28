/*********************************************************************************
	File: 		ASRaiseAware.h
	Created:	June 16, 2003
	Purpose:	This file contains code needed for making a class safe across 
				exceptions.

*
* ___________________
*
*  (c) Copyright 2003-2006 Adobe Systems, Inc.
*  All Rights Reserved.
*
* NOTICE: Adobe permits you to use, modify, and distribute this file
* in accordance with the terms of the Adobe license agreement
* accompanying it. If you have received this file from a source other
* than Adobe, then your use, modification, or distribution of it
* requires the prior written permission of Adobe.
************************************************************************************/
#ifndef _H_ASRAISEAWARE
#define _H_ASRAISEAWARE

/* ============================ C++ compatibility ======================== */

#if defined (__cplusplus)

#ifndef _H_ACEXCEPT
#include "CorCalls.h"
#endif

#if (EXCHANGE || READER)
#include "ACExcept.h"
#endif

/* 
   NEEDS_RAISEAWARE can be set to 0 by modules that wrap all outgoing 
   calls at the module boundary with a DURING/HANDLER and convert them
   to C++ exceptions or error return values. This shields the classes 
   within from ASRaise related issues and hence does not require 
   RAISEAWARE on any platform

   The only downside to NEEDS_RAISEAWARE being 1 is a small 
   performance hit. Hence it is safe, not to disable it by setting it 
   to 0 in case there is doubt on whether it is required.
*/

#ifndef NEEDS_RAISEAWARE

#if (defined(WIN_PLATFORM) && defined(_MSC_VER))
/*
   For modules compiled with VC++, make sure that the module is compiled
   using the /EHsc- switch. Not having that set could result in stack 
   objects not getting cleaned up during a Raise. If that setting is not
   set, then force enable NEEDS_RAISEAWARE by setting it to 1 in the 
   project settings.
*/
	#define NEEDS_RAISEAWARE 0

#elif MAC_PLATFORM
/*
   Since we now use real C++ exceptions for DURING/HANDLER/ASRAISE, we no
   long need RAISEAWARE on Mac.
*/
	#define NEEDS_RAISEAWARE 0

#elif UNIX_PLATFORM

/* serre, 10/6/06
   When DURING/HANDLER/ASRAISE are called from C++ code, a C++
   exception is thrown and we don't need RAISEAWARE to destruct objects
   constructed "on the stack".  
   If DURING/HANDLER/ASRAISE are called from C code, then the setjmp/longjmp
   version of exceptions are used, and there may be resource leaks.  
   We would like to have users only call PDF lib functions from C++ code so
   we don't have to use this RAISEAWARE code. If this turns out to not be 
   acceptable, then we will switch back (or do something else). 
 */
	#define NEEDS_RAISEAWARE 0

#else

	#define NEEDS_RAISEAWARE 1

#endif /* (defined(WIN_PLATFORM) && defined(_MSC_VER)) */

#endif /* NEEDS_RAISEAWARE */



#if (NEEDS_RAISEAWARE)

/*	SUMMARY:
	If your class has a destructor, especially one that releases storage,
	and you're using this with code that can raise, then you should make 
	your class be a RaiseAware Class, so that Raise will invoke the destructor.
	Details on making a class a RaiseAware class is given below.

	DETAILS:
	Define a class of C++ objects that respond to ASRaise by invoking their
	destructors. (If you don't do something like this, then ASRaise will bypass
	the destructor, causing memory leaks and other problems.) The basic scheme
	is that each class uses the RAISEAWARE macro, has a constructor that declares
	a RaiseAwareConstructor, whose sole purpose is to push an exception frame
	when the constructor finishes, and has a destructor that declares a 
	RaiseAwareDestructor, whose sole purpose is to pop the frame when the
	destructor begins. This happens only for stack-based objects.

	This mechanism is used only for stack objects. The check is done within
	the class. This is because the push/pop exception frame calls need to 
	match and that would not happen in case of heap objects.

	If there are two classes A & B then the following stack scenario would 
	break this mechanism too. A a(B b). Where b is sent as a stack object to
	A's constructor. This needs to be avoided.

	The RaiseAware classes should implement their own copy constructor
	and assignment operator and not use the default as it could result in a crash.

	In a class hierarchy, each class needs to be a RAISEAWARE class. Having
	the base class as a RAISEAWARE class with a virtual destructor and all
	its derived classes being non RAISEAWARE does not work. This is because
	when there is a RAISE the base class destructor would be called but none
	of its derived classes.

	Example:

	RAISEAWARECLASS( MyClass )
	class MyClass  
	{
		RAISEAWARE (MyClass)
	...
		MyClass ()
		{
			CTOR;	// macro for creating a RaiseAwareConstructor
			... the real constructor stuff ...
		}
		~MyClass () 
		{
			DTOR;	// macro for creating a RaiseAwareDestructor
			... the real destructor stuff ...
		}
	};
*/

#if DO_ADDITIONAL_RAISEAWARE_CHECKS

#define RAISEAWARECLASS( className )	class className;					\
	template <>																\
	struct IsRaiseAwareClass< className >									\
	{																		\
		typedef int Raise_Aware_Classes_Must_Use_The_Macro_RAISEAWARECLASS;	\
	};

#else

#define RAISEAWARECLASS(X)

#endif

/****************************************************************************/
/*	This class provides for utility classes that are used by both CTOR and DTOR */
class _ra_utils
{
public:
	/*	This is a platform-specific (compiler-specific) routine that tests whether v
		has been allocated on the stack. */
	static ASBool onStack (void* v)
	{
#if MAC_PLATFORM
		int x, *y=&x;
		return (ASBool)((v < (y+4000)) && (v > (y-4000)));
#elif UNIX_PLATFORM
		// Doing this inline causes problems with some compiler
		// optimizations (see bug #1278558)
		// defined in ACExcept.cpp
		return ::onStack(v);
#elif WIN_PLATFORM
		// This is called for cases where the compiler on Windows is not MSVC
		register signed long delta = (unsigned long)v - (unsigned long)&v;
		return delta > 0 && delta < 0x00010000;
#endif
	}
};

/*	This class pushes an exception frame on the stack */
class _ra_ctor
{
	void*		m_obj;
	ACRestoreEnvironProc m_handler;
	ASBool& m_bThrowHandler;

public:
	_ra_ctor (void* obj, ASBool& bFrameHasBeenPopped, ASBool& bThrowHandler, ACRestoreEnvironProc handler)
		: m_obj(obj), m_bThrowHandler(bThrowHandler), m_handler(handler)
	{
		bFrameHasBeenPopped = false;
#if (EXCHANGE || READER || TOOLKIT)
		// TODO: Need to export this API so that it can be accessible thru plugins
		m_bThrowHandler = (ACGetTopExceptionHandlerType() == kASEHTThrowHandler);
#else
		m_bThrowHandler = false;
#endif
	};
	~_ra_ctor()
	{
		if ((_ra_utils::onStack(m_obj) == true) && (!m_bThrowHandler))
		{
			ACPushExceptionFrame(m_obj, m_handler);
		}
	}
};

/*	This class pops the exception frame from the stack */
class _ra_dtor
{
public:
	_ra_dtor(void* obj, ASBool& bFrameHasBeenPopped, ASBool bThrowHandler)
	{
		if ((!bFrameHasBeenPopped) && (_ra_utils::onStack(obj) == true) && (!bThrowHandler))
		{
			/* Prevent that from happening twice. (This could happen if the */ \
			/* derived object's destructor calls Raise.) */ \
			bFrameHasBeenPopped = true; 
			ACPopExceptionFrame();
		}
	}
};

#if DO_ADDITIONAL_RAISEAWARE_CHECKS																					   \

#define CTOR																				       \
	_ra_ctor _ra_ctor_instance(this, _ra_bFrameHasBeenPopped, _ra_bThrowHandler, _ra_handleRaise); \
	IsRaiseAwareClassHelperFunction( this );													   \

#else

#define CTOR \
	_ra_ctor _ra_ctor_instance(this, _ra_bFrameHasBeenPopped, _ra_bThrowHandler, _ra_handleRaise);

#endif


#define DTOR \
	_ra_dtor _ra_dtor_instance(this, _ra_bFrameHasBeenPopped, _ra_bThrowHandler)


/*	This macro makes the copy constructor private as the classes that 
	are RAISEAWARE should not use the default copy constructor. In 
	case the class needs a copy constructor it should have an explicit
	one and then use the macro RAISEAWARE_WITH_COPY_CONSTRUCTOR instead 
*/
#define RAISEAWARE(tagX) \
private: \
	tagX(const tagX& rhs); \
	RAISEAWARE_WITH_COPY_CONSTRUCTOR(tagX)

/*	This macro assumes that the class has an explicit copy constructor 
	and does not use the default copy constructor. Using this macro
	without	an explicit copy constructor will result in a crash
*/
#define RAISEAWARE_WITH_COPY_CONSTRUCTOR(tagX) \
public: \
	ASBool		_ra_bFrameHasBeenPopped; \
	ASBool		_ra_bThrowHandler;\
private: \
	static ACCB1 void ACCB2 _ra_handleRaise(void *vThis) \
{ \
	/* Someone called ASRaise. */ \
	tagX* self = (tagX*) vThis; \
	/* Save the error. */ \
	ASInt32 err = ACGetExceptionErrorCode (); \
	/* Prevent that from happening twice. (This could happen if the */ \
	/* derived object's destructor calls Raise.) */ \
	self->_ra_bFrameHasBeenPopped = true; \
	/* Pop the exception frame. */ \
	ACPopExceptionFrame (); \
	/* Invoke the destructor. */ \
	self->tagX::~tagX (); \
	/* Reraise the error. */ \
	ASRaise (err); \
}

/*	This macro makes the copy constructor private as the structs that 
	are RAISEAWARE should not use the default copy constructor. In 
	case the struct needs a copy constructor it should have an explicit
	one and then use the macro RAISEAWARE_STRUCT_WITH_COPY_CONSTRUCTOR
	instead 
*/
#define RAISEAWARE_STRUCT(tagX) \
private: \
	tagX(const tagX& rhs); \
	RAISEAWARE_STRUCT_WITH_COPY_CONSTRUCTOR(tagX)

/*	This macro assumes that the struct has an explicit copy constructor
	and does not use the default copy constructor. Using this macro without
	an explicit copy constructor will result in a crash
*/
#define RAISEAWARE_STRUCT_WITH_COPY_CONSTRUCTOR(tagX) \
public: \
	ASBool		_ra_bFrameHasBeenPopped; \
	ASBool		_ra_bThrowHandler;\
private: \
	static ACCB1 void ACCB2 _ra_handleRaise(void *vThis) \
{ \
	/* Someone called ASRaise. */ \
	tagX* self = (tagX*) vThis; \
	/* Save the error. */ \
	ASInt32 err = ACGetExceptionErrorCode (); \
	/* Prevent that from happening twice. (This could happen if the */ \
	/* derived object's destructor calls Raise.) */ \
	self->_ra_bFrameHasBeenPopped = true; \
	/* Pop the exception frame. */ \
	ACPopExceptionFrame (); \
	/* Invoke the destructor. */ \
	self->tagX::~tagX (); \
	/* Reraise the error. */ \
	ASRaise (err); \
}

#else /* NEEDS_RAISEAWARE */

#define RAISEAWARECLASS(X)

#if defined(AIX_VACPP) || defined(__SUNPRO_CC)

// On AIX, RAISEAWARE(foo); causes complaints about the 
// trailing semi-colon if it is defined to nothing
#define RAISEAWARE(X) private: \
void raiseaware_compile_stub() {}\

#define RAISEAWARE_WITH_COPY_CONSTRUCTOR(X) private: \
void raiseaware_compile_stub() {}\

#define RAISEAWARE_STRUCT(X) private: \
void raiseaware_compile_stub() {}\

#define RAISEAWARE_STRUCT_WITH_COPY_CONSTRUCTOR(X) private: \
void raiseaware_compile_stub() {}\

#else /* AIX_VACPP || __SUNPRO_CC */

#define RAISEAWARE(X)
#define RAISEAWARE_WITH_COPY_CONSTRUCTOR(X)
#define RAISEAWARE_STRUCT(X)
#define RAISEAWARE_STRUCT_WITH_COPY_CONSTRUCTOR(X)

#endif /* AIX_VACPP || __SUNPRO_CC */


#define CTOR
#define DTOR

#endif /* NEEDS_RAISEAWARE */

/****************************************************************************/

#endif	/* defined (__cplusplus) */

/* ======================================================================= */

#endif /* _H_ASRAISEAWARE */
