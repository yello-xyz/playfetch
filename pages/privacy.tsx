import Link from 'next/link'
import { ReactNode } from 'react'

export default function Privacy() {
  return (
    <main className='flex flex-col h-screen gap-2 p-8 overflow-y-auto bg-gray-25'>
      <div className='max-w-prose'>
        <span className='text-2xl font-semibold'>Privacy Policy</span>
        <NumberedList>
          <ListItem title='ABOUT US AND THIS PRIVACY POLICY'>
            <NumberedList>
              <ListItem>
                This privacy policy sets out how PlayFetch (the trading name of Yello XYZ Limited) (“PlayFetch”, “we”,
                “our”, or “us”) collects, stores, processes, transfers, shares and uses data that identifies or is
                associated with you (your “personal information”) when you use our website at https://playfetch.ai (our
                “Website”), our SaaS platform (our “Platform” and, together with our Website, our Services), or
                otherwise interact with us by email, phone or social media.
              </ListItem>
              <ListItem>
                Please ensure that you have read and understood our collection, storage, use and disclosure of your
                personal information as described in this privacy policy.
              </ListItem>
              <ListItem>
                If you have any questions about this privacy policy or how we use your personal information, please
                contact us by emailing us at hello@playfetch.ai.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='WHO IS RESPONSIBLE FOR YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                We are the data controller of the personal information we collect and use as described in this privacy
                policy. This means that we determine and are responsible for how your personal information is used when
                you use our Services or otherwise interact with us by email, phone or social media.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='PERSONAL INFORMATION WE COLLECT AND HOW WE USE IT'>
            <Title>Information you provide to us</Title>
            <NumberedList>
              <ListItem>
                We collect personal information that you submit directly to us when you use the Services, or otherwise
                communicate with us through email, phone or social media. We will collect the following information in
                this way:
                <NumberedList>
                  <ListItem>
                    Contact information, such as your first name, last name, email address. We collect this information
                    directly from you.
                    <Table>
                      <TableCell>How we use this personal information</TableCell>
                      <TableCell>Legal basis we rely on</TableCell>
                      <TableCell>
                        We use this information to communicate with you about our Services and to set up and manage your
                        account with us.
                      </TableCell>
                      <TableCell>
                        The processing is necessary for our legitimate interests, namely providing and administering
                        accounts and communicating with customers, prospective customers, and business contacts.
                      </TableCell>
                    </Table>
                  </ListItem>
                  <ListItem>
                    Content you submit when using the Platform, such as text input that may be considered personal
                    information. We collect this information directly from you when you submit it to the Platform in
                    order to provide you with the service.
                    <Table>
                      <TableCell>How we use this personal information</TableCell>
                      <TableCell>Legal basis we rely on</TableCell>
                      <TableCell>
                        We use this information to fulfil your request(s) to, among other things, run queries to LLM
                        model providers and present you with the results. To the extent any of this information is used
                        to provide functionalilty within the website we store the queries you run to allow you to access
                        them through your user account.
                      </TableCell>
                      <TableCell>
                        The processing is necessary for the performance of a contract, or to take steps prior to the
                        performance of a contract (namely our Terms of Service).
                      </TableCell>
                      <TableCell>
                        We use this information for data and analytics purposes, such as training our algorithms and
                        models using machine learning to improve and maintain our Services. This is carried out with
                        strict access controls and policies in place to protect your privacy. These activities may
                        include:
                        <BulletList>
                          <Bullet>detecting content prohibited by our Terms of Service;</Bullet>
                          <Bullet>
                            troubleshooting and fixing the Services when they are not working correctly; and
                          </Bullet>
                          <Bullet>getting feedback on our ideas for products or features.</Bullet>
                        </BulletList>
                      </TableCell>
                      <TableCell>
                        The processing is necessary for our legitimate interests, namely:
                        <BulletList>
                          <Bullet>to create, provide and maintain our Services; and</Bullet>
                          <Bullet>
                            to enhance our Services via research and development, data analytics, data labelling,
                            machine learning and predictive analytics.
                          </Bullet>
                        </BulletList>
                      </TableCell>
                    </Table>
                  </ListItem>
                  <ListItem>
                    Comments, queries and feedback that you submit to us when you contact us. We collect this
                    information directly from you.
                    <Table>
                      <TableCell>How we use this personal information</TableCell>
                      <TableCell>Legal basis we rely on</TableCell>
                      <TableCell>
                        We use this information to respond to your comments, queries and feedback about the Services or
                        us.
                      </TableCell>
                      <TableCell>
                        The processing is necessary for our legitimate interests, namely communicating with customers,
                        prospective customers and business contacts.
                      </TableCell>
                      <TableCell>
                        We use this information to tailor the communications we send to you so that they are more
                        relevant to you.
                      </TableCell>
                      <TableCell>
                        The processing is necessary for our legitimate interests, namely ensuring that the contents of
                        any communications that we send is relevant to the recipient’s needs and interests.
                      </TableCell>
                    </Table>
                  </ListItem>
                  <ListItem>
                    Your communication preferences, such as whether you asked or agreed to receive emails from us
                    promoting our Services. We collect this information directly from you.
                    <Table>
                      <TableCell>How we use this personal information</TableCell>
                      <TableCell>Legal basis we rely on</TableCell>
                      <TableCell>
                        We use this information to ensure that we only send promotional communications to you in
                        accordance with your preferences.
                      </TableCell>
                      <TableCell>
                        TThe processing is necessary to comply with a legal obligation to which we are subject, namely
                        laws implementing the ePrivacy Directive 2002/58/EC (as amended).
                      </TableCell>
                    </Table>
                  </ListItem>
                </NumberedList>
              </ListItem>
              <Title>Information we collect automatically</Title>
              <ListItem>
                We also automatically collect certain personal information about you and about how you access the
                Services and your device, including the date and time you access the Services, the actions you take on
                the Services, the operating system and IP address you access the Services from and information about the
                browser you use to access the Services (such as browser version, type and window size).
                <Table>
                  <TableCell>How we use this personal information</TableCell>
                  <TableCell>Legal basis we rely on</TableCell>
                  <TableCell>
                    We use this information so we can present the Services to you in the correct format for your device
                    and browser.
                  </TableCell>
                  <TableCell>
                    The processing is necessary for the performance of a contract, namely the Terms of Service.
                  </TableCell>
                  <TableCell>
                    We use this information to:
                    <BulletList>
                      <Bullet>monitor and maintain the performance and security of our Services;</Bullet>
                      <Bullet>
                        identify errors and ways in which we can improve the Services, including developing and testing
                        new features; and
                      </Bullet>
                      <Bullet>conduct analytics.</Bullet>
                    </BulletList>
                  </TableCell>
                  <TableCell>
                    The processing is necessary for our legitimate interests, namely:
                    <BulletList>
                      <Bullet>ensuring the security and integrity of the Services;</Bullet>
                      <Bullet>to create, provide, support and maintain innovative products and features; and</Bullet>
                      <Bullet>
                        to secure our Services and network, to detect, prevent, and address spam and other bad
                        experiences and to investigate suspicious activity or breaches of our terms or policies.
                      </Bullet>
                    </BulletList>
                  </TableCell>
                </Table>
              </ListItem>
              <ListItem>
                We collect the above information through log files, cookies and similar tracking technologies (see below
                for further information).
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='COOKIES AND SIMILAR TECHNOLOGIES'>
            <NumberedList>
              <ListItem>
                We use cookies and similar tracking technologies. Cookies are pieces of code that we transfer to your
                device for record purposes. This helps us to provide certain functionalities on our Website and our
                Platform as well as to monitor and improve our Services in general.
              </ListItem>
              <ListItem>
                We use the following types of cookies:
                <NumberedList>
                  <ListItem>
                    Strictly necessary cookies. These are cookies that are required for the operation of our Services
                    such as cookies that allow you to log in to your account. Without these cookies, certain elements of
                    our Services would not work.
                  </ListItem>
                  <ListItem>
                    Analytical cookies. These allow us to recognise and count the number of visitors, to see how
                    visitors move around our Services and to monitor performance of certain features on our Services
                    which helps us to improve our Services.
                  </ListItem>
                  <ListItem>
                    Functionality cookies. These are used to recognise you as you move around our Services and to
                    remember information that you enter on the site, such as when you fill out a form.
                  </ListItem>
                </NumberedList>
              </ListItem>
              <ListItem>
                More information about the cookies we use and how long they remain on your device is set out in the
                table below.
                <Table cols='grid-cols-[repeat(4,minmax(0,1fr))]'>
                  <TableCell>Cookie Name</TableCell>
                  <TableCell>Type of cookie</TableCell>
                  <TableCell>When is the cookie set?</TableCell>
                  <TableCell>How long does the cookie stay on my device?</TableCell>
                  <TableCell>Login Session</TableCell>
                  <TableCell>Strictly necessary</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>30 days</TableCell>
                  <TableCell>Google Tag Manager</TableCell>
                  <TableCell>Strictly necessary</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>6 months</TableCell>
                  <TableCell>Google Analytics</TableCell>
                  <TableCell>Analytical</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>6 months</TableCell>
                  <TableCell>Facebook Analytics</TableCell>
                  <TableCell>Analytical</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>90 days</TableCell>
                </Table>
              </ListItem>
              <ListItem>
                Other than cookies that are required to operate our Services, we will only place cookies on your device
                with your consent. If you would like to withdraw your consent to non-essential cookies, you can do this
                by deleting the cookies from your device through your browser settings or mobile device settings and
                rejecting non-essential cookies the next time you access our Website.
              </ListItem>
              <ListItem>
                Most browsers will also allow you to disable all cookies through your browser or mobile settings. These
                settings will typically be found in the “options” or “preferences” menu of your browser. Please note
                that if you choose to refuse cookies you may not be able to use the full functionality of our Services.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='HOW LONG WE KEEP YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                Unless a longer retention period is required or permitted by law, we will only hold your personal
                information on our systems for the period necessary to fulfil the purposes outlined in this Privacy
                Policy or until you request it be deleted. The length of time that we keep your information will vary
                depending on the purposes for which we have it. In any event, we will review what information we need on
                an ongoing basis and will only retain it for the minimum amount of time that we need it for.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='RECIPIENTS'>
            <NumberedList>
              <ListItem>
                As required in accordance with how we use your personal information, we may share your personal
                information as follows:
                <Table>
                  <TableCell>Recipient</TableCell>
                  <TableCell>How they use it</TableCell>
                  <TableCell>
                    Service providers. We may share your personal information with third party vendors and other service
                    providers that perform services for us or on our behalf, such as providing hosting or other
                    technical services such as analytics and AI services, payment services or email services.
                  </TableCell>
                  <TableCell>
                    These service providers will use your personal information as processors on our instructions.
                  </TableCell>
                  <TableCell>
                    Partners that provide complementary services. We may share your personal information with third
                    party partners that perform additional services in connection with our Services, such as printing
                    and merchandise providers.
                  </TableCell>
                  <TableCell>
                    These service providers will use your personal information as processors on our instructions. They
                    may also collect personal information from you in accordance with their privacy notices.
                  </TableCell>
                  <TableCell>
                    Social media. When we interact with you through a social media platform, that social media platform
                    will receive and process the personal information contained in such communications. We may use our
                    social media accounts to interact with and share links to items that you have publicly shared. We
                    will only do this in accordance with the relevant social media platform’s terms of use.
                  </TableCell>
                  <TableCell>
                    Social media platforms will use the personal information they collect in accordance with their
                    privacy notices. Note that if you choose to publicly share something on social media, it may be
                    visible to other users who may not follow or know you. The lawful basis we rely on for transferring
                    this personal information is that the processing is necessary for our legitimate interests, namely
                    communicating with you and our customers through social media, and promoting our Services.
                  </TableCell>
                  <TableCell>
                    Purchasers and third parties in connection with a business transaction. Your personal information
                    may be disclosed to third parties in connection with a transaction, such as a merger, sale of assets
                    or shares, reorganisation, financing, change of control or acquisition of all or a portion of our
                    business.
                  </TableCell>
                  <TableCell>
                    These recipients will use your personal information to assess the potential transaction with us, and
                    otherwise only as disclosed in this privacy policy. The lawful basis we rely on for transferring
                    this personal information is that the processing is necessary for our and the third party’s
                    legitimate interests, namely assessing and executing a potential transaction with us.
                  </TableCell>
                  <TableCell>
                    Law enforcement, regulators and other parties for legal reasons. We may share your personal
                    information with third parties as required by law or if we reasonably believe that such action is
                    necessary to (i) comply with the law and the reasonable requests of law enforcement; (ii) detect and
                    investigate illegal activities and breaches of agreements; and/or (iii) exercise or protect the
                    rights, property, or personal safety of Dreambooks, its users or others.
                  </TableCell>
                  <TableCell>
                    These recipients will use your personal information in the performance of their regulatory or law
                    enforcement role, or to advise us in connection with a potential claim or regulatory enforcement
                    action. The lawful basis we rely on for sharing personal information with these recipients is that
                    the processing is either necessary to comply with a legal obligation to which we are subject or is
                    necessary for our legitimate interests, namely enforcing our rights or complying with requests from
                    regulatory authorities.
                  </TableCell>
                </Table>
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='STORING AND TRANSFERRING YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                Security. We implement appropriate technical and organisational measures to protect your personal
                information against accidental or unlawful destruction, loss, change or damage. All personal information
                we collect will be stored on our hosting provider’s secure servers. We will never send you unsolicited
                emails or contact you by phone requesting your credit or debit card information or national
                identification numbers.
              </ListItem>
              <ListItem>
                International Transfers of your personal information. Your personal information is primarily processed
                within the territory in which you are based but, if you are based in the UK or EEA, we may transfer
                personal information from the EEA or the UK to other locations.
                <NumberedList>
                  <ListItem>
                    When we engage in such transfers of personal information, we rely on:
                    <NumberedList>
                      <ListItem>
                        Adequacy decisions made by the European Commission that recognise the destination country as
                        offering an equivalent level of protection as compared to the level of protection in the country
                        where you are located; or, if you are in the United Kingdom, similar recognition that the
                        destination country offers an equivalent level of protection under the UK Data Protection Act
                        2018 or regulations made by the UK Secretary of State under the UK Data Protection Act 2018; and
                      </ListItem>
                      <ListItem>
                        Standard Contractual Clauses issued by the European Commission and, if you are in the United
                        Kingdom, the approved addendum to those Standard Contractual Clauses issued under the UK Data
                        Protection Act 2018.
                      </ListItem>
                    </NumberedList>
                  </ListItem>
                  <ListItem>
                    We also continually monitor the circumstances surrounding such transfers in order to ensure that
                    these maintain, in practice, a level of protection that is essentially equivalent to the one
                    guaranteed by the UK GDPR and EU GDPR.
                  </ListItem>
                  <ListItem>
                    If you wish to enquire further about the safeguards we use, including obtaining a copy of any
                    Standard Contractual Clauses we have in place with recipients outside the EEA or UK, please contact
                    us using the details in the “About us” section above.
                  </ListItem>
                </NumberedList>
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='YOUR RIGHTS IN RESPECT OF YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                In accordance with applicable privacy law you may have the following rights in respect of your personal
                information that we hold:
                <NumberedList>
                  <ListItem>
                    Right of access. The right to obtain:
                    <NumberedList>
                      <ListItem>
                        confirmation of whether, and where, we are processing your personal information;
                      </ListItem>
                      <ListItem>
                        information about the categories of personal information we are processing, the purposes for
                        which we process your personal information and information as to how we determine applicable
                        retention periods;
                      </ListItem>
                      <ListItem>
                        information about the categories of recipients with whom we may share your personal information;
                        and
                      </ListItem>
                      <ListItem>a copy of the personal information we hold about you.</ListItem>
                    </NumberedList>
                  </ListItem>
                  <ListItem>
                    Right of portability. The right, in certain circumstances, to receive a copy of the personal
                    information you have provided to us in a structured, commonly used, machine-readable format that
                    supports re-use, or to request the transfer of your personal data to another person.
                  </ListItem>
                  <ListItem>
                    Right to rectification. The right to obtain rectification of any inaccurate or incomplete personal
                    information we hold about you without undue delay.
                  </ListItem>
                  <ListItem>
                    Right to erasure. The right, in some circumstances, to require us to erase your personal information
                    without undue delay if the continued processing of that personal information is not justified.
                  </ListItem>
                  <ListItem>
                    Right to restriction. The right, in some circumstances, to require us to limit the purposes for
                    which we process your personal information if the continued processing of the personal information
                    in this way is not justified, such as where the accuracy of the personal information is contested by
                    you.
                  </ListItem>
                </NumberedList>
              </ListItem>
              <ListItem>
                You also have the right to object to any processing based on our legitimate interests where there are
                grounds relating to your particular situation. There may be compelling reasons for continuing to process
                your personal information, and we will assess and inform you if that is the case.
              </ListItem>
              <ListItem>
                You may also have the right to withdraw your consent to our processing of your personal information,
                where our processing is solely based on your consent.
              </ListItem>
              <ListItem>
                If you wish to exercise one of these rights, please contact us using the contact details in the “About
                us” section above.
              </ListItem>
              <ListItem>
                You may also have the right to lodge a complaint to your local data protection authority. If you are
                based in the European Union, information about how to contact your local data protection authority is
                available{' '}
                <Link
                  href='https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm'
                  target='_blank'>
                  here
                </Link>
                . If you are based in the UK, information about how to contact your local data protection authority is
                available{' '}
                <Link href='https://ico.org.uk/global/contact-us/' target='_blank'>
                  here
                </Link>
                .
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='LINKS TO THIRD PARTY SITES'>
            <NumberedList>
              <ListItem>
                The Website may, from time to time, contain links to and from third party websites. If you follow a link
                to any of these websites, please note that these websites have their own privacy policies and that we do
                not accept any responsibility or liability for their policies.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='CHANGES TO THIS POLICY'>
            <NumberedList>
              <ListItem>
                Any updates we may make to our Privacy Policy will be posted on this page. Please check back frequently
                to see any updates or changes to our Privacy Policy. If you do not agree to these updates or changes,
                you should stop using the Services and notify us that you would like us to delete your personal
                information.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='NOTICE TO YOU'>
            <NumberedList>
              <ListItem>
                If we need to provide you with information about something, whether for legal, marketing or other
                business-related purposes, we will select what we believe is the best way to get in contact with you. We
                will usually do this through email or by placing a notice on the Website.
              </ListItem>
            </NumberedList>
          </ListItem>
        </NumberedList>
        <Title>Last updated September 2023</Title>
      </div>
    </main>
  )
}

const BulletList = ({ children }: { children: ReactNode }) => <ul className='list-disc list-inside'>{children}</ul>

const Bullet = ({ children }: { children: ReactNode }) => <li>{children}</li>

const NumberedList = ({ children }: { children: ReactNode }) => (
  <ol className='list-outside [counter-reset:section]'>{children}</ol>
)

const ListItem = ({ title, children }: { title?: string; children: ReactNode }) => (
  <li className='px-2 pt-4 before:[counter-increment:section] before:content-[counters(section,".")"._"]'>
    {title && <span className='font-semibold'>{title}</span>}
    {children}
  </li>
)

const Title = ({ children }: { children: ReactNode }) => <div className='px-2 pt-4 font-semibold'>{children}</div>

const Table = ({ children, cols = 'grid-cols-[repeat(2,minmax(0,1fr))]' }: { children: ReactNode; cols?: string }) => (
  <div className={`mt-4 grid ${cols} border`}>{children}</div>
)

const TableCell = ({ children }: { children: ReactNode }) => <div className='p-2 border'>{children}</div>
